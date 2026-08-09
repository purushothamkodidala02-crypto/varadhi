-- A Subject controls the content language expected from its Questions.
-- General studies can be bilingual, while language subjects remain single-language.
alter table public.subjects
  add column if not exists content_language_mode text not null default 'bilingual'
  check (content_language_mode in ('bilingual', 'english', 'telugu'));

-- Keep one logical Question for both languages. English remains the canonical
-- legacy column, while Telugu is stored alongside it when it applies.
alter table public.questions
  add column if not exists import_key text,
  add column if not exists question_text_te text,
  add column if not exists option_a_te text,
  add column if not exists option_b_te text,
  add column if not exists option_c_te text,
  add column if not exists option_d_te text,
  add column if not exists explanation_te text,
  add column if not exists source_exam_date date;

create unique index if not exists questions_subject_import_key_unique
  on public.questions (subject_id, import_key);

create index if not exists idx_questions_subject_source_exam_date
  on public.questions (subject_id, source_exam_date desc);

-- A running test must retain its language content even if an administrator
-- later updates a Question.
alter table public.test_attempt_session_questions
  add column if not exists content_language_mode text not null default 'bilingual'
    check (content_language_mode in ('bilingual', 'english', 'telugu')),
  add column if not exists question_text_te text,
  add column if not exists option_a_te text,
  add column if not exists option_b_te text,
  add column if not exists option_c_te text,
  add column if not exists option_d_te text,
  add column if not exists explanation_te text;

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
  active_session_id uuid;
  active_expires_at timestamptz;
  new_session_id uuid;
  test_duration_minutes integer;
  snapshot_count integer;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  if not public.can_access_mock_test(requested_mock_test_id) then
    raise exception 'You do not have access to this Mock Test.';
  end if;

  select session.id, session.expires_at
    into active_session_id, active_expires_at
  from public.test_attempt_sessions as session
  where session.user_id = auth.uid()
    and session.mock_test_id = requested_mock_test_id
    and session.submitted_at is null
    and session.expires_at > now()
  order by session.started_at desc
  limit 1;

  if active_session_id is not null then
    return query select active_session_id, requested_mock_test_id, active_expires_at;
    return;
  end if;

  select duration_minutes into test_duration_minutes
  from public.mock_tests
  where id = requested_mock_test_id and status = 'published';

  if test_duration_minutes is null then
    raise exception 'Mock Test is not available.';
  end if;

  insert into public.test_attempt_sessions (user_id, mock_test_id, expires_at)
  values (auth.uid(), requested_mock_test_id, now() + test_duration_minutes * interval '1 minute')
  returning id into new_session_id;

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
  order by assignment.question_order;

  get diagnostics snapshot_count = row_count;
  if snapshot_count = 0 then
    delete from public.test_attempt_sessions where id = new_session_id;
    raise exception 'Mock Test has no active Questions.';
  end if;

  select expires_at into active_expires_at
  from public.test_attempt_sessions where id = new_session_id;
  return query select new_session_id, requested_mock_test_id, active_expires_at;
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
    snapshot.question_id, snapshot.question_order, snapshot.marks,
    snapshot.negative_marks, snapshot.question_text, snapshot.option_a,
    snapshot.option_b, snapshot.option_c, snapshot.option_d, snapshot.image_url,
    answer.selected_answer, snapshot.content_language_mode, snapshot.question_text_te,
    snapshot.option_a_te, snapshot.option_b_te, snapshot.option_c_te, snapshot.option_d_te
  from public.test_attempt_sessions as session
  join public.test_attempt_session_questions as snapshot
    on snapshot.session_id = session.id
  left join public.test_attempt_session_answers as answer
    on answer.session_id = snapshot.session_id and answer.question_id = snapshot.question_id
  where session.id = requested_session_id
    and session.user_id = auth.uid()
    and session.submitted_at is null
  order by snapshot.question_order;
$$;

revoke all on function public.get_mock_test_session_payload(uuid) from public;
grant execute on function public.get_mock_test_session_payload(uuid) to authenticated;
