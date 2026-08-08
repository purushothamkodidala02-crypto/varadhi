-- Lock down profile updates. The application has no student profile-editing
-- feature, so students must never be able to change their role directly.
drop policy if exists "Users can update own profile" on public.profiles;

-- A paid test is available only when an administrator or a future payment
-- integration creates an entitlement for the student.
create table public.mock_test_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_test_id uuid not null references public.mock_tests(id) on delete cascade,
  granted_at timestamptz not null default now(),
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique (user_id, mock_test_id)
);

create index idx_mock_test_entitlements_user_test
  on public.mock_test_entitlements(user_id, mock_test_id);

alter table public.mock_test_entitlements enable row level security;

create policy "Users can view own mock test entitlements"
on public.mock_test_entitlements for select to authenticated
using (user_id = auth.uid());

create policy "Admins can manage mock test entitlements"
on public.mock_test_entitlements for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create or replace function public.can_access_mock_test(
  requested_mock_test_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.mock_tests as mock_test
      where mock_test.id = requested_mock_test_id
        and mock_test.status = 'published'
        and (
          mock_test.access_type = 'free'
          or exists (
            select 1
            from public.mock_test_entitlements as entitlement
            where entitlement.mock_test_id = mock_test.id
              and entitlement.user_id = auth.uid()
          )
        )
    );
$$;

revoke all on function public.can_access_mock_test(uuid) from public;
grant execute on function public.can_access_mock_test(uuid) to authenticated;

-- A session stores the authoritative start and deadline. Question snapshots
-- keep a student's attempt stable if an administrator later edits content.
create table public.test_attempt_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_test_id uuid not null references public.mock_tests(id) on delete restrict,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > started_at)
);

create index idx_test_attempt_sessions_user_test
  on public.test_attempt_sessions(user_id, mock_test_id, expires_at desc);

create table public.test_attempt_session_questions (
  session_id uuid not null references public.test_attempt_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  question_order integer not null check (question_order > 0),
  marks numeric(8,2) not null check (marks > 0),
  negative_marks numeric(8,2) not null check (negative_marks >= 0),
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  explanation text,
  image_url text,
  primary key (session_id, question_id),
  unique (session_id, question_order)
);

create table public.test_attempt_session_answers (
  session_id uuid not null references public.test_attempt_sessions(id) on delete cascade,
  question_id uuid not null,
  selected_answer text not null check (selected_answer in ('A', 'B', 'C', 'D')),
  updated_at timestamptz not null default now(),
  primary key (session_id, question_id),
  foreign key (session_id, question_id)
    references public.test_attempt_session_questions(session_id, question_id)
    on delete cascade
);

alter table public.test_attempt_sessions enable row level security;
alter table public.test_attempt_session_questions enable row level security;
alter table public.test_attempt_session_answers enable row level security;

create policy "Users can view own test sessions"
on public.test_attempt_sessions for select to authenticated
using (user_id = auth.uid());

create policy "Admins can manage test sessions"
on public.test_attempt_sessions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage session questions"
on public.test_attempt_session_questions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage session answers"
on public.test_attempt_session_answers for all to authenticated
using (public.is_admin()) with check (public.is_admin());

alter table public.test_attempts
  add column session_id uuid unique
    references public.test_attempt_sessions(id) on delete restrict;

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

  select duration_minutes
    into test_duration_minutes
  from public.mock_tests
  where id = requested_mock_test_id
    and status = 'published';

  if test_duration_minutes is null then
    raise exception 'Mock Test is not available.';
  end if;

  insert into public.test_attempt_sessions (
    user_id, mock_test_id, expires_at
  ) values (
    auth.uid(), requested_mock_test_id,
    now() + test_duration_minutes * interval '1 minute'
  ) returning id into new_session_id;

  insert into public.test_attempt_session_questions (
    session_id, question_id, question_order, marks, negative_marks,
    question_text, option_a, option_b, option_c, option_d,
    correct_answer, explanation, image_url
  )
  select
    new_session_id, question.id, assignment.question_order,
    assignment.marks, assignment.negative_marks,
    question.question_text, question.option_a, question.option_b,
    question.option_c, question.option_d, question.correct_answer,
    question.explanation, question.image_url
  from public.mock_test_questions as assignment
  join public.questions as question on question.id = assignment.question_id
  where assignment.mock_test_id = requested_mock_test_id
    and question.is_active = true
  order by assignment.question_order;

  get diagnostics snapshot_count = row_count;
  if snapshot_count = 0 then
    delete from public.test_attempt_sessions where id = new_session_id;
    raise exception 'Mock Test has no active Questions.';
  end if;

  select expires_at into active_expires_at
  from public.test_attempt_sessions
  where id = new_session_id;

  return query select new_session_id, requested_mock_test_id, active_expires_at;
end;
$$;

revoke all on function public.start_mock_test_session(uuid) from public;
grant execute on function public.start_mock_test_session(uuid) to authenticated;

create or replace function public.get_mock_test_session_payload(
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
  selected_answer text
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
    answer.selected_answer
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

revoke all on function public.get_mock_test_session_payload(uuid) from public;
grant execute on function public.get_mock_test_session_payload(uuid) to authenticated;

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

  select expires_at into session_expires_at
  from public.test_attempt_sessions
  where id = requested_session_id
    and user_id = auth.uid()
    and submitted_at is null;

  if session_expires_at is null then
    raise exception 'This test attempt is no longer available.';
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

revoke all on function public.save_mock_test_session_answers(uuid, jsonb) from public;
grant execute on function public.save_mock_test_session_answers(uuid, jsonb) to authenticated;

-- PostgreSQL does not allow input parameter names to be renamed through
-- CREATE OR REPLACE, so replace the former test-id based function explicitly.
drop function if exists public.submit_mock_test_attempt(uuid, jsonb);

create function public.submit_mock_test_attempt(
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
    raise exception 'This test attempt was already submitted.';
  end if;

  -- Before the deadline, persist the latest answers together with submission.
  -- After the deadline, grade only the answers saved before time expired.
  if now() <= session_record.expires_at then
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
  set submitted_at = now()
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

revoke all on function public.submit_mock_test_attempt(uuid, jsonb) from public;
grant execute on function public.submit_mock_test_attempt(uuid, jsonb) to authenticated;

-- The former payload function exposed paid-test questions to any logged-in
-- student. New sessions use their own protected snapshots instead.
drop function if exists public.get_mock_test_attempt_payload(uuid);

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
  selected_answer text,
  correct_answer text,
  is_correct boolean,
  marks_awarded numeric,
  explanation text
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
  )
  select
    mock_test.title,
    attempt.score,
    attempt.total_marks,
    attempt.correct_answers,
    attempt.incorrect_answers,
    attempt.unanswered_questions,
    snapshot.question_order,
    snapshot.question_text,
    snapshot.option_a,
    snapshot.option_b,
    snapshot.option_c,
    snapshot.option_d,
    response.selected_answer,
    snapshot.correct_answer,
    coalesce(response.is_correct, false),
    coalesce(response.marks_awarded, 0),
    snapshot.explanation
  from owned_attempt as attempt
  join public.mock_tests as mock_test on mock_test.id = attempt.mock_test_id
  join public.test_attempt_session_questions as snapshot
    on snapshot.session_id = attempt.session_id
  left join public.attempt_responses as response
    on response.attempt_id = attempt.id and response.question_id = snapshot.question_id
  where attempt.session_id is not null

  union all

  select
    mock_test.title,
    attempt.score,
    attempt.total_marks,
    attempt.correct_answers,
    attempt.incorrect_answers,
    attempt.unanswered_questions,
    assignment.question_order,
    question.question_text,
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
    response.selected_answer,
    question.correct_answer,
    coalesce(response.is_correct, false),
    coalesce(response.marks_awarded, 0),
    question.explanation
  from owned_attempt as attempt
  join public.mock_tests as mock_test on mock_test.id = attempt.mock_test_id
  join public.mock_test_questions as assignment on assignment.mock_test_id = mock_test.id
  join public.questions as question on question.id = assignment.question_id
  left join public.attempt_responses as response
    on response.attempt_id = attempt.id and response.question_id = question.id
  where attempt.session_id is null

  order by question_order;
$$;

revoke all on function public.get_attempt_review(uuid) from public;
grant execute on function public.get_attempt_review(uuid) to authenticated;
