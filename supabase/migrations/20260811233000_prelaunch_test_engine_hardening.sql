-- Pre-launch test-engine hardening.
--
-- Goals:
-- 1. exactly one unfinished session per student and Mock Test;
-- 2. no GET/prefetch-dependent session behaviour (the application now starts
--    sessions through a Server Action, but the database remains authoritative);
-- 3. cleared answers and review marks persist correctly;
-- 4. expired Questions never enter a new session;
-- 5. submissions are idempotent and safe to retry.

alter table public.test_attempt_session_answers
  alter column selected_answer drop not null,
  add column if not exists marked_for_review boolean not null default false;

alter table public.profiles
  add constraint profiles_full_name_length
    check (full_name is null or length(full_name) <= 120) not valid;
alter table public.questions
  add constraint questions_text_length check (length(question_text) <= 10000) not valid,
  add constraint questions_option_a_length check (length(option_a) <= 4000) not valid,
  add constraint questions_option_b_length check (length(option_b) <= 4000) not valid,
  add constraint questions_option_c_length check (length(option_c) <= 4000) not valid,
  add constraint questions_option_d_length check (length(option_d) <= 4000) not valid,
  add constraint questions_text_te_length check (question_text_te is null or length(question_text_te) <= 10000) not valid,
  add constraint questions_option_a_te_length check (option_a_te is null or length(option_a_te) <= 4000) not valid,
  add constraint questions_option_b_te_length check (option_b_te is null or length(option_b_te) <= 4000) not valid,
  add constraint questions_option_c_te_length check (option_c_te is null or length(option_c_te) <= 4000) not valid,
  add constraint questions_option_d_te_length check (option_d_te is null or length(option_d_te) <= 4000) not valid,
  add constraint questions_explanation_length check (explanation is null or length(explanation) <= 20000) not valid,
  add constraint questions_explanation_te_length check (explanation_te is null or length(explanation_te) <= 20000) not valid,
  add constraint questions_source_reference_length check (source_reference is null or length(source_reference) <= 1000) not valid,
  add constraint questions_import_key_length check (import_key is null or length(import_key) <= 200) not valid,
  add constraint questions_image_url_https check (image_url is null or image_url ~ '^https://') not valid;
alter table public.mock_test_questions
  add constraint mock_test_questions_marks_positive check (marks > 0) not valid,
  add constraint mock_test_questions_negative_nonnegative check (negative_marks >= 0) not valid;

-- Retain the newest unfinished session if an earlier race created duplicates.
with ranked_sessions as (
  select
    id,
    row_number() over (
      partition by user_id, mock_test_id
      order by started_at desc, id desc
    ) as row_number
  from public.test_attempt_sessions
  where submitted_at is null
)
delete from public.test_attempt_sessions as session
using ranked_sessions as ranked
where session.id = ranked.id
  and ranked.row_number > 1;

create unique index if not exists uq_test_attempt_sessions_one_unfinished
  on public.test_attempt_sessions(user_id, mock_test_id)
  where submitted_at is null;

create index if not exists idx_questions_subject_created_at
  on public.questions(subject_id, created_at desc);
create index if not exists idx_mock_tests_public_catalog
  on public.mock_tests(display_order, series_number)
  where status = 'published' and access_type = 'free';
create index if not exists idx_test_attempts_admin_recent
  on public.test_attempts(submitted_at desc);

create or replace function public.start_mock_test_session(
  requested_mock_test_id uuid
)
returns table (
  session_id uuid,
  mock_test_id uuid,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  resumable_session_id uuid;
  resumable_seconds integer;
  resumed_expires_at timestamptz;
  new_session_id uuid;
  test_duration_minutes integer;
  test_scope text;
  test_paper_id uuid;
  test_subject_id uuid;
  configured_question_count integer;
  snapshot_count integer;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  if not public.can_access_mock_test(requested_mock_test_id) then
    raise exception 'You do not have access to this Mock Test.';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(auth.uid()::text),
    hashtext(requested_mock_test_id::text)
  );

  select session.id, coalesce(session.remaining_seconds, 0)
  into resumable_session_id, resumable_seconds
  from public.test_attempt_sessions as session
  where session.user_id = auth.uid()
    and session.mock_test_id = requested_mock_test_id
    and session.submitted_at is null
  order by session.started_at desc
  limit 1
  for update;

  if resumable_session_id is not null and resumable_seconds > 0 then
    resumed_expires_at := now() + resumable_seconds * interval '1 second';
    update public.test_attempt_sessions
    set session_state = 'active',
        expires_at = resumed_expires_at,
        last_timer_sync_at = now()
    where id = resumable_session_id;
    return query
      select resumable_session_id, requested_mock_test_id, resumed_expires_at;
    return;
  end if;

  -- A zero-time unfinished session cannot be resumed and would conflict with
  -- the one-unfinished-session constraint. Its snapshots are removed by the
  -- cascading foreign keys.
  if resumable_session_id is not null then
    delete from public.test_attempt_sessions where id = resumable_session_id;
  end if;

  select mock_test.duration_minutes, mock_test.test_scope, mock_test.paper_id,
    mock_test.subject_id, paper.question_count
  into test_duration_minutes, test_scope, test_paper_id, test_subject_id,
    configured_question_count
  from public.mock_tests as mock_test
  join public.papers as paper on paper.id = mock_test.paper_id
  where mock_test.id = requested_mock_test_id
    and mock_test.status = 'published';

  if test_duration_minutes is null then
    raise exception 'Mock Test is not available.';
  end if;

  insert into public.test_attempt_sessions (
    user_id, mock_test_id, expires_at, session_state,
    remaining_seconds, last_timer_sync_at
  ) values (
    auth.uid(), requested_mock_test_id,
    now() + test_duration_minutes * interval '1 minute',
    'active', test_duration_minutes * 60, now()
  ) returning id, test_attempt_sessions.expires_at
    into new_session_id, resumed_expires_at;

  insert into public.test_attempt_session_questions (
    session_id, question_id, question_order, marks, negative_marks,
    question_text, option_a, option_b, option_c, option_d,
    correct_answer, explanation, image_url, content_language_mode,
    question_text_te, option_a_te, option_b_te, option_c_te, option_d_te,
    explanation_te
  )
  select
    new_session_id, question.id, assignment.question_order,
    assignment.marks, assignment.negative_marks,
    question.question_text, question.option_a, question.option_b,
    question.option_c, question.option_d, question.correct_answer,
    question.explanation, question.image_url, subject.content_language_mode,
    question.question_text_te, question.option_a_te, question.option_b_te,
    question.option_c_te, question.option_d_te, question.explanation_te
  from public.mock_test_questions as assignment
  join public.questions as question on question.id = assignment.question_id
  join public.subjects as subject on subject.id = question.subject_id
  where assignment.mock_test_id = requested_mock_test_id
    and question.is_active = true
    and subject.paper_id = test_paper_id
    and (test_scope = 'paper' or question.subject_id = test_subject_id)
    and (
      question.content_lifecycle <> 'expires'
      or question.expires_on >= (now() at time zone 'Asia/Kolkata')::date
    )
  order by assignment.question_order;

  get diagnostics snapshot_count = row_count;
  if snapshot_count = 0 then
    delete from public.test_attempt_sessions where id = new_session_id;
    raise exception 'Mock Test has no active Questions.';
  end if;

  if test_scope = 'paper'
     and configured_question_count is not null
     and snapshot_count <> configured_question_count then
    delete from public.test_attempt_sessions where id = new_session_id;
    raise exception 'Mock Test Question count does not match its Paper.';
  end if;

  return query select new_session_id, requested_mock_test_id, resumed_expires_at;
end;
$$;

-- Save an authoritative full answer snapshot. Missing keys represent cleared
-- answers. Review-only rows are retained with a null selected_answer.
create or replace function public.save_mock_test_session_answers(
  requested_session_id uuid,
  submitted_answers jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  session_expires_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  if jsonb_typeof(submitted_answers) <> 'object' then
    raise exception 'Invalid submitted answers.';
  end if;

  select session.expires_at into session_expires_at
  from public.test_attempt_sessions as session
  where session.id = requested_session_id
    and session.user_id = auth.uid()
    and session.submitted_at is null
    and session.session_state = 'active'
  for update;

  if session_expires_at is null then
    raise exception 'This test attempt is no longer active.';
  end if;

  if now() > session_expires_at then
    raise exception 'The test time has ended.';
  end if;

  if exists (
    select 1
    from jsonb_each_text(submitted_answers) as item(question_key, selected_value)
    where item.selected_value not in ('A', 'B', 'C', 'D')
      or not exists (
        select 1
        from public.test_attempt_session_questions as snapshot
        where snapshot.session_id = requested_session_id
          and snapshot.question_id::text = item.question_key
      )
  ) then
    raise exception 'One or more submitted answers are invalid.';
  end if;

  update public.test_attempt_session_answers as answer
  set selected_answer = null,
      updated_at = now()
  where answer.session_id = requested_session_id
    and answer.selected_answer is not null
    and not (submitted_answers ? answer.question_id::text);

  insert into public.test_attempt_session_answers (
    session_id, question_id, selected_answer
  )
  select requested_session_id, snapshot.question_id, item.selected_value
  from jsonb_each_text(submitted_answers) as item(question_key, selected_value)
  join public.test_attempt_session_questions as snapshot
    on snapshot.session_id = requested_session_id
    and snapshot.question_id::text = item.question_key
  on conflict (session_id, question_id) do update
    set selected_answer = excluded.selected_answer,
        updated_at = now();
end;
$$;

create or replace function public.save_mock_test_answer_update(
  requested_session_id uuid,
  requested_question_id uuid,
  requested_answer text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  session_expires_at timestamptz;
begin
  if requested_answer is not null and requested_answer not in ('A', 'B', 'C', 'D') then
    raise exception 'Invalid answer choice.';
  end if;

  select session.expires_at into session_expires_at
  from public.test_attempt_sessions as session
  where session.id = requested_session_id
    and session.user_id = auth.uid()
    and session.submitted_at is null
    and session.session_state = 'active'
  for update;

  if session_expires_at is null or now() > session_expires_at then
    raise exception 'This test attempt is no longer active.';
  end if;

  if not exists (
    select 1 from public.test_attempt_session_questions
    where session_id = requested_session_id
      and question_id = requested_question_id
  ) then
    raise exception 'Question is not part of this attempt.';
  end if;

  insert into public.test_attempt_session_answers (
    session_id, question_id, selected_answer
  ) values (
    requested_session_id, requested_question_id, requested_answer
  )
  on conflict (session_id, question_id) do update
    set selected_answer = excluded.selected_answer,
        updated_at = now();
end;
$$;

create or replace function public.save_mock_test_review_mark(
  requested_session_id uuid,
  requested_question_id uuid,
  requested_mark boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.test_attempt_sessions as session
    join public.test_attempt_session_questions as snapshot
      on snapshot.session_id = session.id
    where session.id = requested_session_id
      and session.user_id = auth.uid()
      and session.submitted_at is null
      and snapshot.question_id = requested_question_id
  ) then
    raise exception 'Question is not part of this attempt.';
  end if;

  insert into public.test_attempt_session_answers (
    session_id, question_id, selected_answer, marked_for_review
  ) values (
    requested_session_id, requested_question_id, null, requested_mark
  )
  on conflict (session_id, question_id) do update
    set marked_for_review = excluded.marked_for_review,
        updated_at = now();
end;
$$;

create or replace function public.pause_mock_test_session(
  requested_session_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  paused_seconds integer;
begin
  update public.test_attempt_sessions as session
  set remaining_seconds = greatest(
        0,
        ceil(extract(epoch from (session.expires_at - now())))::integer
      ),
      session_state = 'paused',
      last_timer_sync_at = now()
  where session.id = requested_session_id
    and session.user_id = auth.uid()
    and session.submitted_at is null
    and session.session_state = 'active'
  returning session.remaining_seconds into paused_seconds;

  if paused_seconds is null then
    raise exception 'This practice attempt is not active.';
  end if;
  return paused_seconds;
end;
$$;

drop function if exists public.get_mock_test_session_payload(uuid);
create function public.get_mock_test_session_payload(
  requested_session_id uuid
)
returns table (
  question_id uuid,
  question_order integer,
  marks numeric,
  negative_marks numeric,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  image_url text,
  selected_answer text,
  marked_for_review boolean,
  content_language_mode text,
  question_text_te text,
  option_a_te text,
  option_b_te text,
  option_c_te text,
  option_d_te text
)
language sql
security definer
set search_path = public
as $$
  select
    snapshot.question_id,
    snapshot.question_order,
    snapshot.marks,
    snapshot.negative_marks,
    snapshot.question_text,
    snapshot.option_a,
    snapshot.option_b,
    snapshot.option_c,
    snapshot.option_d,
    snapshot.image_url,
    answer.selected_answer,
    coalesce(answer.marked_for_review, false),
    snapshot.content_language_mode,
    snapshot.question_text_te,
    snapshot.option_a_te,
    snapshot.option_b_te,
    snapshot.option_c_te,
    snapshot.option_d_te
  from public.test_attempt_sessions as session
  join public.test_attempt_session_questions as snapshot
    on snapshot.session_id = session.id
  left join public.test_attempt_session_answers as answer
    on answer.session_id = snapshot.session_id
    and answer.question_id = snapshot.question_id
  where session.id = requested_session_id
    and session.user_id = auth.uid()
    and session.submitted_at is null
  order by snapshot.question_order;
$$;

-- Replace submission with retry-safe behaviour. A repeated request returns the
-- already committed attempt instead of reporting a false failure.
create or replace function public.submit_mock_test_attempt(
  requested_session_id uuid,
  submitted_answers jsonb
)
returns table (
  attempt_id uuid,
  score numeric,
  total_marks numeric,
  correct_answers integer,
  incorrect_answers integer,
  unanswered_questions integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  session_record record;
  existing_attempt record;
  new_attempt_id uuid;
  calculated_score numeric(8,2) := 0;
  calculated_total numeric(8,2) := 0;
  calculated_correct integer := 0;
  calculated_incorrect integer := 0;
  calculated_unanswered integer := 0;
  snapshot_record record;
  selected text;
  awarded numeric(8,2);
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  if jsonb_typeof(submitted_answers) <> 'object' then
    raise exception 'Invalid submitted answers.';
  end if;

  select * into session_record
  from public.test_attempt_sessions
  where id = requested_session_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Test attempt not found.';
  end if;

  if session_record.submitted_at is not null then
    select * into existing_attempt
    from public.test_attempts
    where session_id = requested_session_id
      and user_id = auth.uid();

    if existing_attempt.id is null then
      raise exception 'Submitted attempt result is unavailable.';
    end if;

    return query select
      existing_attempt.id,
      existing_attempt.score,
      existing_attempt.total_marks,
      existing_attempt.correct_answers,
      existing_attempt.incorrect_answers,
      existing_attempt.unanswered_questions;
    return;
  end if;

  if now() <= session_record.expires_at
     and session_record.session_state = 'active' then
    perform public.save_mock_test_session_answers(
      requested_session_id,
      submitted_answers
    );
  end if;

  for snapshot_record in
    select snapshot.question_id, snapshot.marks, snapshot.negative_marks,
      snapshot.correct_answer
    from public.test_attempt_session_questions as snapshot
    where snapshot.session_id = requested_session_id
    order by snapshot.question_order
  loop
    calculated_total := calculated_total + snapshot_record.marks;

    select answer.selected_answer into selected
    from public.test_attempt_session_answers as answer
    where answer.session_id = requested_session_id
      and answer.question_id = snapshot_record.question_id;

    if selected is null then
      calculated_unanswered := calculated_unanswered + 1;
    elsif selected = snapshot_record.correct_answer then
      calculated_correct := calculated_correct + 1;
      calculated_score := calculated_score + snapshot_record.marks;
    else
      calculated_incorrect := calculated_incorrect + 1;
      calculated_score := calculated_score - snapshot_record.negative_marks;
    end if;
  end loop;

  if calculated_total = 0 then
    raise exception 'Mock Test has no Questions.';
  end if;

  update public.test_attempt_sessions
  set submitted_at = now(),
      remaining_seconds = greatest(
        0,
        coalesce(remaining_seconds, 0)
      )
  where id = requested_session_id
    and submitted_at is null;

  insert into public.test_attempts (
    user_id, mock_test_id, session_id, score, total_marks, correct_answers,
    incorrect_answers, unanswered_questions
  ) values (
    auth.uid(), session_record.mock_test_id, requested_session_id,
    calculated_score, calculated_total, calculated_correct,
    calculated_incorrect, calculated_unanswered
  ) returning id into new_attempt_id;

  for snapshot_record in
    select snapshot.question_id, snapshot.marks, snapshot.negative_marks,
      snapshot.correct_answer
    from public.test_attempt_session_questions as snapshot
    where snapshot.session_id = requested_session_id
  loop
    select answer.selected_answer into selected
    from public.test_attempt_session_answers as answer
    where answer.session_id = requested_session_id
      and answer.question_id = snapshot_record.question_id;

    if selected is not null then
      awarded := case when selected = snapshot_record.correct_answer
        then snapshot_record.marks else -snapshot_record.negative_marks end;

      insert into public.attempt_responses (
        attempt_id, question_id, selected_answer, is_correct, marks_awarded
      ) values (
        new_attempt_id, snapshot_record.question_id, selected,
        selected = snapshot_record.correct_answer, awarded
      );
    end if;
  end loop;

  return query select new_attempt_id, calculated_score, calculated_total,
    calculated_correct, calculated_incorrect, calculated_unanswered;
end;
$$;

-- Public aggregate data for catalogue cards. It never returns Question text,
-- options, explanations, or correct answers.
create or replace function public.get_published_mock_test_stats()
returns table (
  mock_test_id uuid,
  question_count bigint,
  total_marks numeric,
  maximum_negative_marks numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mock_test.id,
    count(question.id),
    coalesce(sum(case when question.id is not null then assignment.marks else 0 end), 0),
    coalesce(max(case when question.id is not null then assignment.negative_marks else 0 end), 0)
  from public.mock_tests as mock_test
  left join public.mock_test_questions as assignment
    on assignment.mock_test_id = mock_test.id
  left join public.questions as question
    on question.id = assignment.question_id
    and question.is_active = true
    and (
      question.content_lifecycle <> 'expires'
      or question.expires_on >= (now() at time zone 'Asia/Kolkata')::date
    )
  where mock_test.status = 'published'
    and mock_test.access_type = 'free'
  group by mock_test.id;
$$;

create or replace function public.publish_mock_test_safely(
  requested_mock_test_id uuid
)
returns table (
  question_count bigint,
  total_marks numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  test_record record;
  actual_question_count bigint;
  actual_total_marks numeric;
  invalid_question_count bigint;
begin
  if not public.is_admin() then
    raise exception 'Administrator MFA verification is required.';
  end if;

  select mock_test.id, mock_test.status, mock_test.test_scope,
    mock_test.paper_id, mock_test.subject_id, mock_test.access_type,
    paper.question_count as configured_question_count
  into test_record
  from public.mock_tests as mock_test
  join public.papers as paper on paper.id = mock_test.paper_id
  where mock_test.id = requested_mock_test_id
  for update of mock_test;

  if test_record.id is null then
    raise exception 'Mock Test not found.';
  end if;
  if test_record.status <> 'draft' then
    raise exception 'Only draft Mock Tests can be published.';
  end if;
  if test_record.access_type <> 'free' then
    raise exception 'Paid Mock Tests cannot be published before payment verification is enabled.';
  end if;

  select
    count(*),
    coalesce(sum(assignment.marks), 0),
    count(*) filter (
      where question.id is null
        or not question.is_active
        or subject.id is null
        or subject.paper_id <> test_record.paper_id
        or (
          test_record.test_scope = 'subject'
          and question.subject_id <> test_record.subject_id
        )
        or (
          question.content_lifecycle = 'expires'
          and question.expires_on < (now() at time zone 'Asia/Kolkata')::date
        )
        or assignment.marks <= 0
        or assignment.negative_marks < 0
    )
  into actual_question_count, actual_total_marks, invalid_question_count
  from public.mock_test_questions as assignment
  left join public.questions as question on question.id = assignment.question_id
  left join public.subjects as subject on subject.id = question.subject_id
  where assignment.mock_test_id = requested_mock_test_id;

  if actual_question_count = 0 then
    raise exception 'Add at least one Question before publishing.';
  end if;
  if invalid_question_count > 0 then
    raise exception 'Every assigned Question and mark must be active and valid.';
  end if;
  if test_record.test_scope = 'paper'
     and test_record.configured_question_count is not null
     and actual_question_count <> test_record.configured_question_count then
    raise exception 'The assigned Question count must match the Paper Question count.';
  end if;

  update public.mock_tests
  set status = 'published',
      published_at = now()
  where id = requested_mock_test_id;

  return query select actual_question_count, actual_total_marks;
end;
$$;

create or replace function public.get_admin_attempt_summary()
returns table (
  completed_attempts bigint,
  participants bigint,
  average_score numeric,
  average_accuracy numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator MFA verification is required.';
  end if;

  return query
  select
    count(*),
    count(distinct attempt.user_id),
    coalesce(avg(case when attempt.total_marks = 0 then 0 else attempt.score / attempt.total_marks * 100 end), 0),
    coalesce(avg(case when attempt.correct_answers + attempt.incorrect_answers = 0 then 0 else attempt.correct_answers::numeric / (attempt.correct_answers + attempt.incorrect_answers) * 100 end), 0)
  from public.test_attempts as attempt;
end;
$$;

-- Create an Exam, its optional Specialisations, and every Paper as one unit.
-- Any validation or insert failure rolls back the complete structure.
create or replace function public.create_exam_structure_atomic(
  requested_exam_id uuid,
  requested_name text,
  requested_slug text,
  requested_description text,
  requested_is_active boolean,
  requested_display_order integer,
  requested_direct_papers jsonb,
  requested_specializations jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
  new_specialization_id uuid;
  specialization jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator MFA verification is required.';
  end if;
  if jsonb_typeof(requested_direct_papers) <> 'array'
     or jsonb_typeof(requested_specializations) <> 'array' then
    raise exception 'Invalid Exam structure.';
  end if;
  if jsonb_array_length(requested_direct_papers) > 20
     or jsonb_array_length(requested_specializations) > 20 then
    raise exception 'The Exam structure is too large.';
  end if;
  if not exists (select 1 from public.exams where id = requested_exam_id) then
    raise exception 'The selected Exam Category could not be found.';
  end if;

  perform pg_advisory_xact_lock(hashtext(requested_exam_id::text));
  if exists (
    select 1 from public.exam_groups
    where exam_id = requested_exam_id
      and lower(btrim(name)) = lower(btrim(requested_name))
  ) then
    raise exception 'An Exam with this name already exists in the selected category.';
  end if;

  insert into public.exam_groups (
    exam_id, name, slug, description, is_active, display_order
  ) values (
    requested_exam_id, btrim(requested_name), requested_slug,
    nullif(btrim(requested_description), ''), requested_is_active,
    requested_display_order
  ) returning id into new_group_id;

  insert into public.papers (
    exam_group_id, specialization_id, name, slug, duration_minutes,
    question_count, default_correct_marks, default_negative_marks,
    display_order, is_active
  )
  select
    new_group_id, null, paper.name, paper.slug, paper.duration_minutes,
    paper.question_count, paper.default_correct_marks,
    paper.default_negative_marks, paper.display_order, requested_is_active
  from jsonb_to_recordset(requested_direct_papers) as paper(
    name text, slug text, duration_minutes integer, question_count integer,
    default_correct_marks numeric, default_negative_marks numeric,
    display_order integer
  );

  for specialization in
    select value from jsonb_array_elements(requested_specializations)
  loop
    insert into public.exam_specializations (
      exam_group_id, name, slug, display_order, is_active
    ) values (
      new_group_id,
      btrim(specialization ->> 'name'),
      specialization ->> 'slug',
      (specialization ->> 'display_order')::integer,
      requested_is_active
    ) returning id into new_specialization_id;

    insert into public.papers (
      exam_group_id, specialization_id, name, slug, duration_minutes,
      question_count, default_correct_marks, default_negative_marks,
      display_order, is_active
    )
    select
      new_group_id, new_specialization_id, paper.name, paper.slug,
      paper.duration_minutes, paper.question_count,
      paper.default_correct_marks, paper.default_negative_marks,
      paper.display_order, requested_is_active
    from jsonb_to_recordset(specialization -> 'papers') as paper(
      name text, slug text, duration_minutes integer, question_count integer,
      default_correct_marks numeric, default_negative_marks numeric,
      display_order integer
    );
  end loop;

  return new_group_id;
end;
$$;

-- Upsert a validated Question file and optionally assign it to one draft Mock
-- Test in the same transaction. An assignment error rolls back the Question
-- Bank changes as well, avoiding partial imports.
create or replace function public.import_questions_atomic(
  requested_paper_id uuid,
  requested_mock_test_id uuid,
  requested_questions jsonb,
  requested_assignments jsonb
)
returns table (
  added integer,
  updated integer,
  assigned integer,
  already_assigned integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_test record;
begin
  if not public.is_admin() then
    raise exception 'Administrator MFA verification is required.';
  end if;
  if jsonb_typeof(requested_questions) <> 'array'
     or jsonb_typeof(requested_assignments) <> 'array'
     or jsonb_array_length(requested_questions) = 0
     or jsonb_array_length(requested_questions) > 500 then
    raise exception 'Invalid Question import.';
  end if;

  if not exists (select 1 from public.papers where id = requested_paper_id) then
    raise exception 'The selected Paper could not be found.';
  end if;

  if exists (
    select 1
    from jsonb_populate_recordset(null::public.questions, requested_questions) as question
    left join public.subjects as subject on subject.id = question.subject_id
    where subject.id is null or subject.paper_id <> requested_paper_id
  ) then
    raise exception 'Every Question must belong to the selected Paper.';
  end if;

  if requested_mock_test_id is not null then
    select mock_test.id, mock_test.paper_id, mock_test.subject_id,
      mock_test.test_scope, mock_test.status
    into target_test
    from public.mock_tests as mock_test
    where mock_test.id = requested_mock_test_id
    for update;

    if target_test.id is null or target_test.status <> 'draft' then
      raise exception 'Only a draft Mock Test can receive this import.';
    end if;
    if target_test.paper_id <> requested_paper_id then
      raise exception 'The Mock Test and import Paper do not match.';
    end if;
    if jsonb_array_length(requested_assignments) <> jsonb_array_length(requested_questions) then
      raise exception 'Every imported Question needs assignment settings.';
    end if;
    if target_test.test_scope = 'subject' and exists (
      select 1
      from jsonb_populate_recordset(null::public.questions, requested_questions) as question
      where question.subject_id <> target_test.subject_id
    ) then
      raise exception 'This subject Mock Test accepts only its selected Subject.';
    end if;

    perform 1 from public.mock_test_questions
    where mock_test_id = requested_mock_test_id
    for update;
  end if;

  return query
  with input as materialized (
    select question.*
    from jsonb_populate_recordset(null::public.questions, requested_questions) as question
  ),
  existing_before as materialized (
    select question.id, question.subject_id, question.import_key
    from public.questions as question
    join input on input.subject_id = question.subject_id
      and input.import_key = question.import_key
  ),
  upserted as (
    insert into public.questions (
      subject_id, import_key, question_text, question_type,
      option_a, option_b, option_c, option_d, correct_answer, explanation,
      question_text_te, option_a_te, option_b_te, option_c_te, option_d_te,
      explanation_te, source_reference, source_exam_date, difficulty,
      is_active, content_lifecycle, review_on, expires_on
    )
    select
      input.subject_id, input.import_key, input.question_text,
      input.question_type, input.option_a, input.option_b, input.option_c,
      input.option_d, input.correct_answer, input.explanation,
      input.question_text_te, input.option_a_te, input.option_b_te,
      input.option_c_te, input.option_d_te, input.explanation_te,
      input.source_reference, input.source_exam_date, input.difficulty,
      input.is_active, input.content_lifecycle, input.review_on,
      input.expires_on
    from input
    on conflict (subject_id, import_key) do update set
      question_text = excluded.question_text,
      question_type = excluded.question_type,
      option_a = excluded.option_a,
      option_b = excluded.option_b,
      option_c = excluded.option_c,
      option_d = excluded.option_d,
      correct_answer = excluded.correct_answer,
      explanation = excluded.explanation,
      question_text_te = excluded.question_text_te,
      option_a_te = excluded.option_a_te,
      option_b_te = excluded.option_b_te,
      option_c_te = excluded.option_c_te,
      option_d_te = excluded.option_d_te,
      explanation_te = excluded.explanation_te,
      source_reference = excluded.source_reference,
      source_exam_date = excluded.source_exam_date,
      difficulty = excluded.difficulty,
      is_active = excluded.is_active,
      content_lifecycle = excluded.content_lifecycle,
      review_on = excluded.review_on,
      expires_on = excluded.expires_on,
      updated_at = now()
    returning id, subject_id, import_key
  ),
  preferences as materialized (
    select preference.*
    from jsonb_to_recordset(requested_assignments) as preference(
      subject_id uuid, import_key text, question_order integer,
      marks numeric, negative_marks numeric
    )
  ),
  current_assignments as materialized (
    select assignment.question_id, assignment.question_order
    from public.mock_test_questions as assignment
    where requested_mock_test_id is not null
      and assignment.mock_test_id = requested_mock_test_id
  ),
  candidates as materialized (
    select upserted.id as question_id, preferences.subject_id,
      preferences.import_key, preferences.question_order,
      preferences.marks, preferences.negative_marks
    from preferences
    join upserted using (subject_id, import_key)
    where requested_mock_test_id is not null
      and not exists (
        select 1 from current_assignments
        where current_assignments.question_id = upserted.id
      )
  ),
  order_base as (
    select greatest(
      coalesce((select max(question_order) from current_assignments), 0),
      coalesce((select max(question_order) from candidates), 0)
    ) as value
  ),
  assignment_rows as (
    select question_id, question_order, marks, negative_marks
    from candidates where question_order is not null
    union all
    select candidate.question_id,
      (order_base.value + row_number() over (order by candidate.subject_id, candidate.import_key))::integer,
      candidate.marks, candidate.negative_marks
    from candidates as candidate cross join order_base
    where candidate.question_order is null
  ),
  inserted_assignments as (
    insert into public.mock_test_questions (
      mock_test_id, question_id, question_order, marks, negative_marks
    )
    select requested_mock_test_id, assignment_rows.question_id,
      assignment_rows.question_order, assignment_rows.marks,
      assignment_rows.negative_marks
    from assignment_rows
    returning question_id
  )
  select
    (select count(*) from upserted
      where not exists (
        select 1 from existing_before
        where existing_before.subject_id = upserted.subject_id
          and existing_before.import_key = upserted.import_key
      ))::integer,
    (select count(*) from upserted
      where exists (
        select 1 from existing_before
        where existing_before.subject_id = upserted.subject_id
          and existing_before.import_key = upserted.import_key
      ))::integer,
    (select count(*) from inserted_assignments)::integer,
    (select count(*)
      from preferences
      join upserted using (subject_id, import_key)
      where exists (
        select 1 from current_assignments
        where current_assignments.question_id = upserted.id
      ))::integer;
end;
$$;

revoke all on function public.start_mock_test_session(uuid) from public;
revoke all on function public.save_mock_test_session_answers(uuid, jsonb) from public;
revoke all on function public.save_mock_test_answer_update(uuid, uuid, text) from public;
revoke all on function public.save_mock_test_review_mark(uuid, uuid, boolean) from public;
revoke all on function public.pause_mock_test_session(uuid) from public;
revoke all on function public.get_mock_test_session_payload(uuid) from public;
revoke all on function public.submit_mock_test_attempt(uuid, jsonb) from public;
revoke all on function public.get_published_mock_test_stats() from public;
revoke all on function public.publish_mock_test_safely(uuid) from public;
revoke all on function public.get_admin_attempt_summary() from public;
revoke all on function public.create_exam_structure_atomic(uuid, text, text, text, boolean, integer, jsonb, jsonb) from public;
revoke all on function public.import_questions_atomic(uuid, uuid, jsonb, jsonb) from public;

grant execute on function public.start_mock_test_session(uuid) to authenticated;
grant execute on function public.save_mock_test_session_answers(uuid, jsonb) to authenticated;
grant execute on function public.save_mock_test_answer_update(uuid, uuid, text) to authenticated;
grant execute on function public.save_mock_test_review_mark(uuid, uuid, boolean) to authenticated;
grant execute on function public.pause_mock_test_session(uuid) to authenticated;
grant execute on function public.get_mock_test_session_payload(uuid) to authenticated;
grant execute on function public.submit_mock_test_attempt(uuid, jsonb) to authenticated;
grant execute on function public.get_published_mock_test_stats() to anon, authenticated;
grant execute on function public.publish_mock_test_safely(uuid) to authenticated;
grant execute on function public.get_admin_attempt_summary() to authenticated;
grant execute on function public.create_exam_structure_atomic(uuid, text, text, text, boolean, integer, jsonb, jsonb) to authenticated;
grant execute on function public.import_questions_atomic(uuid, uuid, jsonb, jsonb) to authenticated;

notify pgrst, 'reload schema';
