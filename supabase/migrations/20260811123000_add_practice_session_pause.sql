-- Varadhi mock tests are practice sessions: students may pause, resume and retake.
alter table public.test_attempt_sessions
  add column if not exists session_state text not null default 'active'
    check (session_state in ('active', 'paused')),
  add column if not exists remaining_seconds integer
    check (remaining_seconds is null or remaining_seconds >= 0),
  add column if not exists last_timer_sync_at timestamptz;

update public.test_attempt_sessions
set remaining_seconds = greatest(0, ceil(extract(epoch from (expires_at - now())))::integer),
    session_state = 'paused',
    last_timer_sync_at = now()
where submitted_at is null
  and remaining_seconds is null;

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
  snapshot_count integer;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  if not public.can_access_mock_test(requested_mock_test_id) then
    raise exception 'You do not have access to this Mock Test.';
  end if;

  select session.id, coalesce(session.remaining_seconds, 0)
  into resumable_session_id, resumable_seconds
  from public.test_attempt_sessions as session
  where session.user_id = auth.uid()
    and session.mock_test_id = requested_mock_test_id
    and session.submitted_at is null
    and coalesce(session.remaining_seconds, 0) > 0
  order by session.started_at desc
  limit 1;

  if resumable_session_id is not null then
    resumed_expires_at := now() + resumable_seconds * interval '1 second';
    update public.test_attempt_sessions
    set session_state = 'active',
        remaining_seconds = resumable_seconds,
        expires_at = resumed_expires_at,
        last_timer_sync_at = now()
    where id = resumable_session_id;
    return query select resumable_session_id, requested_mock_test_id, resumed_expires_at;
    return;
  end if;

  select mock_test.duration_minutes into test_duration_minutes
  from public.mock_tests as mock_test
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
  order by assignment.question_order;

  get diagnostics snapshot_count = row_count;
  if snapshot_count = 0 then
    delete from public.test_attempt_sessions where id = new_session_id;
    raise exception 'Mock Test has no active Questions.';
  end if;

  return query select new_session_id, requested_mock_test_id, resumed_expires_at;
end;
$$;

create or replace function public.sync_mock_test_session_timer(
  requested_session_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  synced_seconds integer;
begin
  update public.test_attempt_sessions as session
  set remaining_seconds = greatest(0, ceil(extract(epoch from (session.expires_at - now())))::integer),
      last_timer_sync_at = now()
  where session.id = requested_session_id
    and session.user_id = auth.uid()
    and session.submitted_at is null
    and session.session_state = 'active'
  returning session.remaining_seconds into synced_seconds;

  if synced_seconds is null then
    raise exception 'This practice attempt is not active.';
  end if;
  return synced_seconds;
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
  set remaining_seconds = greatest(0, ceil(extract(epoch from (session.expires_at - now())))::integer),
      session_state = 'paused',
      last_timer_sync_at = now()
  where session.id = requested_session_id
    and session.user_id = auth.uid()
    and session.submitted_at is null
  returning session.remaining_seconds into paused_seconds;

  if paused_seconds is null then
    raise exception 'This practice attempt is no longer available.';
  end if;
  return paused_seconds;
end;
$$;

revoke all on function public.sync_mock_test_session_timer(uuid) from public;
revoke all on function public.pause_mock_test_session(uuid) from public;
grant execute on function public.sync_mock_test_session_timer(uuid) to authenticated;
grant execute on function public.pause_mock_test_session(uuid) to authenticated;

notify pgrst, 'reload schema';
