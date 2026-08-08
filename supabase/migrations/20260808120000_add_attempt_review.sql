-- This review payload is available only after a submitted attempt and only to
-- its owner. It intentionally includes the answer key for post-test learning.
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
  from public.test_attempts as attempt
  join public.mock_tests as mock_test on mock_test.id = attempt.mock_test_id
  join public.mock_test_questions as assignment on assignment.mock_test_id = mock_test.id
  join public.questions as question on question.id = assignment.question_id
  left join public.attempt_responses as response
    on response.attempt_id = attempt.id and response.question_id = question.id
  where attempt.id = requested_attempt_id
    and attempt.user_id = auth.uid()
  order by assignment.question_order;
$$;

revoke all on function public.get_attempt_review(uuid) from public;
grant execute on function public.get_attempt_review(uuid) to authenticated;
