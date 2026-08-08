create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_test_id uuid not null references public.mock_tests(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  score numeric(8,2) not null,
  total_marks numeric(8,2) not null,
  correct_answers integer not null,
  incorrect_answers integer not null,
  unanswered_questions integer not null,
  created_at timestamptz not null default now()
);

create table public.attempt_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_answer text not null check (selected_answer in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  marks_awarded numeric(8,2) not null,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index idx_test_attempts_user_id on public.test_attempts(user_id, submitted_at desc);
create index idx_test_attempts_mock_test_id on public.test_attempts(mock_test_id);
create index idx_attempt_responses_attempt_id on public.attempt_responses(attempt_id);

alter table public.test_attempts enable row level security;
alter table public.attempt_responses enable row level security;

create policy "Users can view own attempts"
on public.test_attempts for select to authenticated
using (user_id = auth.uid());

create policy "Users can view own attempt responses"
on public.attempt_responses for select to authenticated
using (
  exists (
    select 1 from public.test_attempts
    where test_attempts.id = attempt_responses.attempt_id
      and test_attempts.user_id = auth.uid()
  )
);

create policy "Admins can manage test attempts"
on public.test_attempts for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage attempt responses"
on public.attempt_responses for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create or replace function public.submit_mock_test_attempt(
  requested_mock_test_id uuid,
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
  new_attempt_id uuid;
  calculated_score numeric(8,2) := 0;
  calculated_total numeric(8,2) := 0;
  calculated_correct integer := 0;
  calculated_incorrect integer := 0;
  calculated_unanswered integer := 0;
  assignment_record record;
  selected text;
  awarded numeric(8,2);
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  if jsonb_typeof(submitted_answers) <> 'object' then
    raise exception 'Invalid submitted answers.';
  end if;

  if not exists (
    select 1 from public.mock_tests
    where id = requested_mock_test_id and status = 'published'
  ) then
    raise exception 'Mock Test is not available.';
  end if;

  for assignment_record in
    select assignment.question_id, assignment.marks, assignment.negative_marks,
      question.correct_answer
    from public.mock_test_questions as assignment
    join public.questions as question on question.id = assignment.question_id
    where assignment.mock_test_id = requested_mock_test_id
      and question.is_active = true
    order by assignment.question_order
  loop
    calculated_total := calculated_total + assignment_record.marks;
    selected := submitted_answers ->> assignment_record.question_id::text;

    if selected is null then
      calculated_unanswered := calculated_unanswered + 1;
    elsif selected not in ('A', 'B', 'C', 'D') then
      raise exception 'Invalid answer choice.';
    elsif selected = assignment_record.correct_answer then
      calculated_correct := calculated_correct + 1;
      calculated_score := calculated_score + assignment_record.marks;
    else
      calculated_incorrect := calculated_incorrect + 1;
      calculated_score := calculated_score - assignment_record.negative_marks;
    end if;
  end loop;

  if calculated_total = 0 then
    raise exception 'Mock Test has no active Questions.';
  end if;

  insert into public.test_attempts (
    user_id, mock_test_id, score, total_marks, correct_answers,
    incorrect_answers, unanswered_questions
  ) values (
    auth.uid(), requested_mock_test_id, calculated_score, calculated_total,
    calculated_correct, calculated_incorrect, calculated_unanswered
  ) returning id into new_attempt_id;

  for assignment_record in
    select assignment.question_id, assignment.marks, assignment.negative_marks,
      question.correct_answer
    from public.mock_test_questions as assignment
    join public.questions as question on question.id = assignment.question_id
    where assignment.mock_test_id = requested_mock_test_id
      and question.is_active = true
  loop
    selected := submitted_answers ->> assignment_record.question_id::text;
    if selected is not null then
      awarded := case when selected = assignment_record.correct_answer
        then assignment_record.marks else -assignment_record.negative_marks end;
      insert into public.attempt_responses (
        attempt_id, question_id, selected_answer, is_correct, marks_awarded
      ) values (
        new_attempt_id, assignment_record.question_id, selected,
        selected = assignment_record.correct_answer, awarded
      );
    end if;
  end loop;

  return query select new_attempt_id, calculated_score, calculated_total,
    calculated_correct, calculated_incorrect, calculated_unanswered;
end;
$$;

revoke all on function public.submit_mock_test_attempt(uuid, jsonb) from public;
grant execute on function public.submit_mock_test_attempt(uuid, jsonb) to authenticated;
