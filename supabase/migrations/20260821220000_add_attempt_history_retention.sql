-- Keep compact attempt summaries for the account lifetime while limiting the
-- much larger question-by-question snapshots to the latest 100 attempts or
-- attempts submitted during the last 365 days. Unfinished sessions expire
-- after 30 days.

alter table public.test_attempts
  add column if not exists detailed_review_available boolean not null default true;

comment on column public.test_attempts.detailed_review_available is
  'True while the question-by-question snapshot is retained. Attempt summary fields remain for the account lifetime.';

create index if not exists idx_test_attempts_review_retention
  on public.test_attempts(user_id, submitted_at desc)
  where detailed_review_available = true;

create or replace function public.get_student_attempt_history_summary()
returns table (
  completed_attempts bigint,
  average_score numeric,
  latest_score numeric,
  latest_total_marks numeric,
  latest_mock_test_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  with owned_attempts as materialized (
    select attempt.mock_test_id, attempt.submitted_at,
      attempt.score, attempt.total_marks
    from public.test_attempts as attempt
    where attempt.user_id = auth.uid()
  )
  select
    (select count(*) from owned_attempts),
    coalesce((
      select round(avg(
        case when total_marks = 0 then 0
          else 100.0 * score / total_marks
        end
      ), 1)
      from owned_attempts
    ), 0),
    (select score from owned_attempts order by submitted_at desc limit 1),
    (select total_marks from owned_attempts order by submitted_at desc limit 1),
    (select mock_test_id from owned_attempts order by submitted_at desc limit 1);
$$;

revoke all on function public.get_student_attempt_history_summary() from public;
grant execute on function public.get_student_attempt_history_summary() to authenticated;

create or replace function public.cleanup_attempt_history_retention()
returns table (
  pruned_detailed_reviews integer,
  removed_unfinished_sessions integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  pruned_count integer := 0;
  removed_session_count integer := 0;
begin
  if current_user not in ('postgres', 'supabase_admin')
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role is required.';
  end if;

  with ranked_attempts as materialized (
    select attempt.id, attempt.session_id, attempt.submitted_at,
      row_number() over (
        partition by attempt.user_id
        order by attempt.submitted_at desc, attempt.id desc
      ) as attempt_rank
    from public.test_attempts as attempt
    where attempt.detailed_review_available = true
  ),
  marked_attempts as (
    update public.test_attempts as attempt
    set detailed_review_available = false
    from ranked_attempts as ranked
    where attempt.id = ranked.id
      and ranked.attempt_rank > 100
      and ranked.submitted_at < now() - interval '365 days'
    returning attempt.id, attempt.session_id
  ),
  removed_responses as (
    delete from public.attempt_responses as response
    where response.attempt_id in (select id from marked_attempts)
    returning response.id
  ),
  removed_snapshots as (
    delete from public.test_attempt_session_questions as snapshot
    where snapshot.session_id in (
      select session_id from marked_attempts where session_id is not null
    )
    returning snapshot.session_id
  )
  select count(*)::integer into pruned_count from marked_attempts;

  with removed_sessions as (
    delete from public.test_attempt_sessions as session
    where session.submitted_at is null
      and session.created_at < now() - interval '30 days'
      and not exists (
        select 1 from public.test_attempts as attempt
        where attempt.session_id = session.id
      )
    returning session.id
  )
  select count(*)::integer into removed_session_count from removed_sessions;

  return query select pruned_count, removed_session_count;
end;
$$;

revoke all on function public.cleanup_attempt_history_retention() from public;
grant execute on function public.cleanup_attempt_history_retention() to service_role;

-- Enforce review availability inside the RPC as well as in the dashboard UI.
-- This prevents a pruned legacy attempt from falling back to today's edited
-- Question Bank content.
create or replace function public.get_attempt_review(
  requested_attempt_id uuid
)
returns table (
  mock_test_title text,
  score numeric,
  total_marks numeric,
  correct_answers integer,
  incorrect_answers integer,
  unanswered_questions integer,
  question_order integer,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  content_language_mode text,
  question_text_te text,
  option_a_te text,
  option_b_te text,
  option_c_te text,
  option_d_te text,
  selected_answer text,
  correct_answer text,
  is_correct boolean,
  marks_awarded numeric,
  explanation text,
  explanation_te text,
  image_url text
)
language sql
security definer
set search_path = public
as $$
  with owned_attempt as (
    select *
    from public.test_attempts
    where id = requested_attempt_id
      and user_id = auth.uid()
      and detailed_review_available = true
  )
  select
    mock_test.title, attempt.score, attempt.total_marks,
    attempt.correct_answers, attempt.incorrect_answers,
    attempt.unanswered_questions, snapshot.question_order,
    snapshot.question_text, snapshot.option_a, snapshot.option_b,
    snapshot.option_c, snapshot.option_d, snapshot.content_language_mode,
    snapshot.question_text_te, snapshot.option_a_te, snapshot.option_b_te,
    snapshot.option_c_te, snapshot.option_d_te, response.selected_answer,
    snapshot.correct_answer, coalesce(response.is_correct, false),
    coalesce(response.marks_awarded, 0), snapshot.explanation,
    snapshot.explanation_te, snapshot.image_url
  from owned_attempt as attempt
  join public.mock_tests as mock_test on mock_test.id = attempt.mock_test_id
  join public.test_attempt_session_questions as snapshot
    on snapshot.session_id = attempt.session_id
  left join public.attempt_responses as response
    on response.attempt_id = attempt.id
    and response.question_id = snapshot.question_id
  where attempt.session_id is not null

  union all

  select
    mock_test.title, attempt.score, attempt.total_marks,
    attempt.correct_answers, attempt.incorrect_answers,
    attempt.unanswered_questions, assignment.question_order,
    question.question_text, question.option_a, question.option_b,
    question.option_c, question.option_d, subject.content_language_mode,
    question.question_text_te, question.option_a_te, question.option_b_te,
    question.option_c_te, question.option_d_te, response.selected_answer,
    question.correct_answer, coalesce(response.is_correct, false),
    coalesce(response.marks_awarded, 0), question.explanation,
    question.explanation_te, question.image_url
  from owned_attempt as attempt
  join public.mock_tests as mock_test on mock_test.id = attempt.mock_test_id
  join public.mock_test_questions as assignment
    on assignment.mock_test_id = mock_test.id
  join public.questions as question on question.id = assignment.question_id
  join public.subjects as subject on subject.id = question.subject_id
  left join public.attempt_responses as response
    on response.attempt_id = attempt.id
    and response.question_id = question.id
  where attempt.session_id is null

  order by question_order;
$$;

revoke all on function public.get_attempt_review(uuid) from public;
grant execute on function public.get_attempt_review(uuid) to authenticated;

-- Supabase Cron runs the cleanup daily. The guarded block keeps local or
-- restricted Postgres environments usable when pg_cron is unavailable.
do $$
begin
  create extension if not exists pg_cron with schema pg_catalog;

  if not exists (
    select 1 from cron.job where jobname = 'varadhi-attempt-history-retention'
  ) then
    perform cron.schedule(
      'varadhi-attempt-history-retention',
      '17 3 * * *',
      'select * from public.cleanup_attempt_history_retention()'
    );
  end if;
exception
  when insufficient_privilege or undefined_file or invalid_schema_name then
    raise notice 'pg_cron is unavailable; call cleanup_attempt_history_retention with the service role.';
end;
$$;

notify pgrst, 'reload schema';
