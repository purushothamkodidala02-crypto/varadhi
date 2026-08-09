-- The return column `expires_at` of this function has the same name as the
-- session table column. Qualify the table column so PostgreSQL does not treat
-- the final lookup as ambiguous when a student starts a test.
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

  select mock_test.duration_minutes into test_duration_minutes
  from public.mock_tests as mock_test
  where mock_test.id = requested_mock_test_id
    and mock_test.status = 'published';

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

  select session.expires_at into active_expires_at
  from public.test_attempt_sessions as session
  where session.id = new_session_id;

  return query select new_session_id, requested_mock_test_id, active_expires_at;
end;
$$;

revoke all on function public.start_mock_test_session(uuid) from public;
grant execute on function public.start_mock_test_session(uuid) to authenticated;

notify pgrst, 'reload schema';
