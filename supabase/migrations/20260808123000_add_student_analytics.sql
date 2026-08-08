create or replace function public.get_student_subject_analytics()
returns table (
  subject_name text,
  answered_questions bigint,
  correct_answers bigint,
  accuracy numeric,
  net_marks numeric
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(subject.name, 'General') as subject_name,
    count(response.id) as answered_questions,
    count(response.id) filter (where response.is_correct) as correct_answers,
    round(
      100.0 * count(response.id) filter (where response.is_correct)
      / nullif(count(response.id), 0),
      1
    ) as accuracy,
    coalesce(sum(response.marks_awarded), 0) as net_marks
  from public.attempt_responses as response
  join public.test_attempts as attempt on attempt.id = response.attempt_id
  join public.questions as question on question.id = response.question_id
  left join public.subjects as subject on subject.id = question.subject_id
  where attempt.user_id = auth.uid()
  group by subject.name
  order by accuracy asc, answered_questions desc, subject_name asc;
$$;

revoke all on function public.get_student_subject_analytics() from public;
grant execute on function public.get_student_subject_analytics() to authenticated;
