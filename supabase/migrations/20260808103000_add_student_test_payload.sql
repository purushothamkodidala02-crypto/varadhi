-- Deliver only the fields required to take a published Mock Test.
-- Correct answers and explanations remain inaccessible to student clients.
create or replace function public.get_mock_test_attempt_payload(
  requested_mock_test_id uuid
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
  image_url text
)
language sql
security definer
set search_path = public
as $$
  select
    question.id,
    assignment.question_order,
    assignment.marks,
    assignment.negative_marks,
    question.question_text,
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
    question.image_url
  from public.mock_test_questions as assignment
  join public.mock_tests as mock_test
    on mock_test.id = assignment.mock_test_id
  join public.questions as question
    on question.id = assignment.question_id
  where assignment.mock_test_id = requested_mock_test_id
    and mock_test.status = 'published'
    and question.is_active = true
    and auth.uid() is not null
  order by assignment.question_order;
$$;

revoke all on function public.get_mock_test_attempt_payload(uuid) from public;
grant execute on function public.get_mock_test_attempt_payload(uuid) to authenticated;
