-- Store question diagrams in a public, size-limited bucket. Public reads are
-- required during mock tests; only MFA-verified administrators may mutate it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-media',
  'question-media',
  true,
  2000000,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload question media" on storage.objects;
create policy "Admins upload question media"
on storage.objects for insert to authenticated
with check (bucket_id = 'question-media' and public.is_admin());

drop policy if exists "Admins update question media" on storage.objects;
create policy "Admins update question media"
on storage.objects for update to authenticated
using (bucket_id = 'question-media' and public.is_admin())
with check (bucket_id = 'question-media' and public.is_admin());

drop policy if exists "Admins delete question media" on storage.objects;
create policy "Admins delete question media"
on storage.objects for delete to authenticated
using (bucket_id = 'question-media' and public.is_admin());

-- Include image_url in atomic spreadsheet imports so image rows remain part of
-- the same all-or-nothing transaction as their question and assignment data.
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
      explanation_te, image_url, source_reference, source_exam_date, difficulty,
      is_active, content_lifecycle, review_on, expires_on
    )
    select
      input.subject_id, input.import_key, input.question_text,
      input.question_type, input.option_a, input.option_b, input.option_c,
      input.option_d, input.correct_answer, input.explanation,
      input.question_text_te, input.option_a_te, input.option_b_te,
      input.option_c_te, input.option_d_te, input.explanation_te,
      input.image_url, input.source_reference, input.source_exam_date,
      input.difficulty, input.is_active, input.content_lifecycle,
      input.review_on, input.expires_on
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
      image_url = excluded.image_url,
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

-- Preserve the question image in submitted-attempt review output.
drop function if exists public.get_attempt_review(uuid);

create function public.get_attempt_review(
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

revoke all on function public.import_questions_atomic(uuid, uuid, jsonb, jsonb) from public;
grant execute on function public.import_questions_atomic(uuid, uuid, jsonb, jsonb) to authenticated;
revoke all on function public.get_attempt_review(uuid) from public;
grant execute on function public.get_attempt_review(uuid) to authenticated;

notify pgrst, 'reload schema';
