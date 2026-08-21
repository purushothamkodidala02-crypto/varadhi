-- Give every mock test an explicit, enforceable question target.
alter table public.mock_tests
  add column if not exists target_question_count integer;

update public.mock_tests as mock_test
set target_question_count = case
  when mock_test.test_scope = 'paper' then coalesce(
    paper.question_count,
    nullif((select count(*) from public.mock_test_questions as assignment where assignment.mock_test_id = mock_test.id), 0),
    1
  )
  else coalesce(
    nullif((select count(*) from public.mock_test_questions as assignment where assignment.mock_test_id = mock_test.id), 0),
    paper.question_count,
    1
  )
end
from public.papers as paper
where paper.id = mock_test.paper_id
  and mock_test.target_question_count is null;

update public.mock_tests set target_question_count = 1
where target_question_count is null;

alter table public.mock_tests
  alter column target_question_count set not null,
  add constraint mock_tests_target_question_count_positive
    check (target_question_count > 0 and target_question_count <= 500);

-- Attempts make the assigned question set historical. Draft assignment changes
-- and target changes are blocked once any attempt exists.
create or replace function public.guard_mock_test_question_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  target_test record;
  assigned_count integer;
begin
  target_id := case when tg_op = 'DELETE' then old.mock_test_id else new.mock_test_id end;
  select id, status, target_question_count into target_test
  from public.mock_tests where id = target_id for update;

  if target_test.id is null then
    if tg_op = 'DELETE' then return old; end if;
    raise exception 'Mock Test not found.';
  end if;
  if target_test.status <> 'draft' then
    raise exception 'Published or archived Mock Tests cannot be changed.';
  end if;
  if exists (select 1 from public.test_attempts where mock_test_id = target_id) then
    raise exception 'This Mock Test has student attempts and its Questions are locked.';
  end if;

  if tg_op = 'INSERT' then
    select count(*) into assigned_count
    from public.mock_test_questions where mock_test_id = target_id;
    if assigned_count >= target_test.target_question_count then
      raise exception 'The Mock Test already has its target number of Questions.';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists guard_mock_test_question_mutation on public.mock_test_questions;
create trigger guard_mock_test_question_mutation
before insert or update or delete on public.mock_test_questions
for each row execute function public.guard_mock_test_question_mutation();

create or replace function public.guard_mock_test_target_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_count integer;
begin
  if new.target_question_count is distinct from old.target_question_count
     or new.paper_id is distinct from old.paper_id
     or new.subject_id is distinct from old.subject_id
     or new.test_scope is distinct from old.test_scope then
    if old.status <> 'draft' then
      raise exception 'Only draft Mock Tests can change their target Question count.';
    end if;
    if exists (select 1 from public.test_attempts where mock_test_id = old.id) then
      raise exception 'This Mock Test has student attempts and its target is locked.';
    end if;
    select count(*) into assigned_count
    from public.mock_test_questions where mock_test_id = old.id;
    if assigned_count > 0 and (
      new.paper_id is distinct from old.paper_id
      or new.subject_id is distinct from old.subject_id
      or new.test_scope is distinct from old.test_scope
    ) then
      raise exception 'Remove all assigned Questions before changing the Mock Test Paper or Subject.';
    end if;
    if new.target_question_count < assigned_count then
      raise exception 'Remove Questions before lowering the target below the assigned count.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_mock_test_target_change on public.mock_tests;
create trigger guard_mock_test_target_change
before update of target_question_count, paper_id, subject_id, test_scope on public.mock_tests
for each row execute function public.guard_mock_test_target_change();

create or replace function public.fill_mock_test_with_latest_questions(
  requested_mock_test_id uuid
)
returns table (assigned integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_test record;
  current_count integer;
  inserted_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Administrator MFA verification is required.';
  end if;
  select mock_test.*, paper.default_correct_marks, paper.default_negative_marks
  into target_test
  from public.mock_tests as mock_test
  join public.papers as paper on paper.id = mock_test.paper_id
  where mock_test.id = requested_mock_test_id
  for update of mock_test;
  if target_test.id is null then raise exception 'Mock Test not found.'; end if;
  if target_test.status <> 'draft' then raise exception 'Only draft Mock Tests can be changed.'; end if;
  if exists (select 1 from public.test_attempts where mock_test_id = requested_mock_test_id) then
    raise exception 'This Mock Test has student attempts and its Questions are locked.';
  end if;

  select count(*) into current_count from public.mock_test_questions
  where mock_test_id = requested_mock_test_id;
  if current_count >= target_test.target_question_count then
    return query select 0, 0;
    return;
  end if;

  with candidates as materialized (
    select question.id,
      row_number() over (order by question.created_at desc, question.id) as row_number
    from public.questions as question
    join public.subjects as subject on subject.id = question.subject_id
    where subject.paper_id = target_test.paper_id
      and (target_test.test_scope = 'paper' or question.subject_id = target_test.subject_id)
      and question.is_active
      and (question.content_lifecycle <> 'expires' or question.expires_on >= (now() at time zone 'Asia/Kolkata')::date)
      and not exists (
        select 1 from public.mock_test_questions as assignment
        where assignment.mock_test_id = requested_mock_test_id
          and assignment.question_id = question.id
      )
    order by question.created_at desc, question.id
    limit (target_test.target_question_count - current_count)
  )
  insert into public.mock_test_questions (
    mock_test_id, question_id, question_order, marks, negative_marks
  )
  select requested_mock_test_id, candidate.id,
    current_count + candidate.row_number,
    coalesce(target_test.default_correct_marks, 1),
    coalesce(target_test.default_negative_marks, 0)
  from candidates as candidate;

  get diagnostics inserted_count = row_count;
  return query select inserted_count,
    greatest(target_test.target_question_count - current_count - inserted_count, 0);
end;
$$;

create or replace function public.move_mock_test_question(
  requested_mock_test_id uuid,
  requested_assignment_id uuid,
  requested_direction integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_assignment record;
  neighbour record;
  temporary_order integer;
begin
  if not public.is_admin() then raise exception 'Administrator MFA verification is required.'; end if;
  if requested_direction not in (-1, 1) then raise exception 'Invalid move direction.'; end if;
  select * into current_assignment from public.mock_test_questions
  where id = requested_assignment_id and mock_test_id = requested_mock_test_id for update;
  if current_assignment.id is null then raise exception 'Assigned Question not found.'; end if;
  select * into neighbour from public.mock_test_questions
  where mock_test_id = requested_mock_test_id
    and ((requested_direction = -1 and question_order < current_assignment.question_order)
      or (requested_direction = 1 and question_order > current_assignment.question_order))
  order by case when requested_direction = -1 then -question_order else question_order end
  limit 1 for update;
  if neighbour.id is null then return; end if;
  select coalesce(max(question_order), 0) + 1000 into temporary_order
  from public.mock_test_questions where mock_test_id = requested_mock_test_id;
  update public.mock_test_questions set question_order = temporary_order where id = current_assignment.id;
  update public.mock_test_questions set question_order = current_assignment.question_order where id = neighbour.id;
  update public.mock_test_questions set question_order = neighbour.question_order where id = current_assignment.id;
end;
$$;

create or replace function public.delete_question_safely(requested_question_id uuid)
returns table (deleted_image_url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_question record;
begin
  if not public.is_admin() then raise exception 'Administrator MFA verification is required.'; end if;
  select id, image_url into target_question from public.questions
  where id = requested_question_id for update;
  if target_question.id is null then raise exception 'Question not found.'; end if;
  if exists (select 1 from public.mock_test_questions where question_id = requested_question_id) then
    raise exception 'This Question is assigned to a Mock Test. Remove its assignments first.';
  end if;
  if exists (select 1 from public.test_attempt_session_questions where question_id = requested_question_id)
     or exists (select 1 from public.attempt_responses where question_id = requested_question_id) then
    raise exception 'This Question is required for a retained student attempt or answer review.';
  end if;
  delete from public.questions where id = requested_question_id;
  return query select case
    when target_question.image_url is not null and not exists (
      select 1 from public.questions where image_url = target_question.image_url
    ) then target_question.image_url::text
    else null::text
  end;
end;
$$;

create or replace function public.make_question_unavailable_safely(requested_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Administrator MFA verification is required.'; end if;
  if exists (
    select 1 from public.mock_test_questions as assignment
    join public.mock_tests as mock_test on mock_test.id = assignment.mock_test_id
    where assignment.question_id = requested_question_id
      and mock_test.status = 'published'
  ) then
    raise exception 'This Question belongs to a published Mock Test. Hide that test before making the Question unavailable.';
  end if;
  update public.questions set is_active = false where id = requested_question_id;
  if not found then raise exception 'Question not found.'; end if;
end;
$$;

-- Atomic full replacement. File validation occurs in the server action first;
-- this function repeats ownership, count, scope and scoring checks in the DB.
create or replace function public.replace_mock_test_questions_atomic(
  requested_paper_id uuid,
  requested_mock_test_id uuid,
  requested_questions jsonb,
  requested_assignments jsonb
)
returns table (
  added integer,
  updated integer,
  assigned integer,
  deleted_orphans integer,
  orphan_image_urls text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_test record;
  question_input public.questions%rowtype;
  preference record;
  item jsonb;
  saved_question_id uuid;
  old_question_ids uuid[];
  deleted_images text[] := array[]::text[];
  added_count integer := 0;
  updated_count integer := 0;
  assigned_count integer := 0;
  deleted_count integer := 0;
  existed boolean;
begin
  if not public.is_admin() then raise exception 'Administrator MFA verification is required.'; end if;
  if jsonb_typeof(requested_questions) <> 'array'
     or jsonb_typeof(requested_assignments) <> 'array'
     or jsonb_array_length(requested_questions) = 0
     or jsonb_array_length(requested_questions) > 500
     or jsonb_array_length(requested_questions) <> jsonb_array_length(requested_assignments) then
    raise exception 'Invalid replacement file.';
  end if;

  select mock_test.* into target_test from public.mock_tests as mock_test
  where mock_test.id = requested_mock_test_id for update;
  if target_test.id is null then raise exception 'Mock Test not found.'; end if;
  if target_test.status <> 'draft' then raise exception 'Only draft Mock Tests can be replaced.'; end if;
  if target_test.paper_id <> requested_paper_id then raise exception 'The Mock Test and import Paper do not match.'; end if;
  if exists (select 1 from public.test_attempts where mock_test_id = requested_mock_test_id) then
    raise exception 'This Mock Test has student attempts and cannot be replaced.';
  end if;
  if jsonb_array_length(requested_questions) <> target_test.target_question_count then
    raise exception 'The replacement file must contain exactly % valid Questions.', target_test.target_question_count;
  end if;
  if exists (
    select 1
    from jsonb_populate_recordset(null::public.questions, requested_questions) as question
    left join public.subjects as subject on subject.id = question.subject_id
    where subject.id is null
      or subject.paper_id <> requested_paper_id
      or (target_test.test_scope = 'subject' and question.subject_id <> target_test.subject_id)
  ) then raise exception 'Every replacement Question must belong to this Mock Test Paper and Subject.'; end if;
  if exists (
    select 1 from jsonb_to_recordset(requested_assignments) as assignment(
      subject_id uuid, import_key text, question_order integer, marks numeric, negative_marks numeric
    ) where question_order < 1 or question_order > target_test.target_question_count
      or marks <= 0 or negative_marks < 0
  ) then raise exception 'Every replacement order and score must be valid.'; end if;
  if (select count(distinct assignment.question_order)
      from jsonb_to_recordset(requested_assignments) as assignment(
        subject_id uuid, import_key text, question_order integer, marks numeric, negative_marks numeric
      )) <> target_test.target_question_count then
    raise exception 'Replacement Question order numbers must be unique.';
  end if;

  select coalesce(array_agg(question_id), array[]::uuid[]) into old_question_ids
  from public.mock_test_questions where mock_test_id = requested_mock_test_id;
  delete from public.mock_test_questions where mock_test_id = requested_mock_test_id;

  for item in select value from jsonb_array_elements(requested_questions)
  loop
    select * into question_input from jsonb_populate_record(null::public.questions, item);
    select exists (
      select 1 from public.questions
      where subject_id = question_input.subject_id and import_key = question_input.import_key
    ) into existed;

    insert into public.questions (
      subject_id, import_key, question_text, question_type,
      option_a, option_b, option_c, option_d, correct_answer, explanation,
      question_text_te, option_a_te, option_b_te, option_c_te, option_d_te,
      explanation_te, image_url, source_reference, source_exam_date, difficulty,
      is_active, content_lifecycle, review_on, expires_on
    ) values (
      question_input.subject_id, question_input.import_key, question_input.question_text,
      question_input.question_type, question_input.option_a, question_input.option_b,
      question_input.option_c, question_input.option_d, question_input.correct_answer,
      question_input.explanation, question_input.question_text_te, question_input.option_a_te,
      question_input.option_b_te, question_input.option_c_te, question_input.option_d_te,
      question_input.explanation_te, question_input.image_url, question_input.source_reference,
      question_input.source_exam_date, question_input.difficulty, question_input.is_active,
      question_input.content_lifecycle, question_input.review_on, question_input.expires_on
    )
    on conflict (subject_id, import_key) do update set
      question_text = excluded.question_text, question_type = excluded.question_type,
      option_a = excluded.option_a, option_b = excluded.option_b,
      option_c = excluded.option_c, option_d = excluded.option_d,
      correct_answer = excluded.correct_answer, explanation = excluded.explanation,
      question_text_te = excluded.question_text_te, option_a_te = excluded.option_a_te,
      option_b_te = excluded.option_b_te, option_c_te = excluded.option_c_te,
      option_d_te = excluded.option_d_te, explanation_te = excluded.explanation_te,
      image_url = excluded.image_url, source_reference = excluded.source_reference,
      source_exam_date = excluded.source_exam_date, difficulty = excluded.difficulty,
      is_active = excluded.is_active, content_lifecycle = excluded.content_lifecycle,
      review_on = excluded.review_on, expires_on = excluded.expires_on, updated_at = now()
    returning id into saved_question_id;

    if existed then updated_count := updated_count + 1; else added_count := added_count + 1; end if;
    select * into preference
    from jsonb_to_recordset(requested_assignments) as assignment(
      subject_id uuid, import_key text, question_order integer, marks numeric, negative_marks numeric
    ) where assignment.subject_id = question_input.subject_id
      and assignment.import_key = question_input.import_key;
    if preference.import_key is null then raise exception 'Every replacement Question needs assignment settings.'; end if;
    insert into public.mock_test_questions (
      mock_test_id, question_id, question_order, marks, negative_marks
    ) values (
      requested_mock_test_id, saved_question_id, preference.question_order,
      preference.marks, preference.negative_marks
    );
    assigned_count := assigned_count + 1;
  end loop;

  with deleted as (
    delete from public.questions as question
    where question.id = any(old_question_ids)
      and not exists (select 1 from public.mock_test_questions where question_id = question.id)
      and not exists (select 1 from public.test_attempt_session_questions where question_id = question.id)
      and not exists (select 1 from public.attempt_responses where question_id = question.id)
    returning question.image_url
  )
  select count(*), coalesce(array_agg(deleted.image_url) filter (
    where deleted.image_url is not null
      and not exists (select 1 from public.questions where image_url = deleted.image_url)
  ), array[]::text[])
  into deleted_count, deleted_images from deleted;

  return query select added_count, updated_count, assigned_count, deleted_count, deleted_images;
end;
$$;

create or replace function public.publish_mock_test_safely(requested_mock_test_id uuid)
returns table (question_count bigint, total_marks numeric)
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
  if not public.is_admin() then raise exception 'Administrator MFA verification is required.'; end if;
  select mock_test.* into test_record from public.mock_tests as mock_test
  where mock_test.id = requested_mock_test_id for update;
  if test_record.id is null then raise exception 'Mock Test not found.'; end if;
  if test_record.status <> 'draft' then raise exception 'Only draft Mock Tests can be published.'; end if;
  if test_record.access_type <> 'free' then raise exception 'Paid Mock Tests cannot be published before payment verification is enabled.'; end if;
  select count(*), coalesce(sum(assignment.marks), 0), count(*) filter (
    where question.id is null or not question.is_active or subject.id is null
      or subject.paper_id <> test_record.paper_id
      or (test_record.test_scope = 'subject' and question.subject_id <> test_record.subject_id)
      or (question.content_lifecycle = 'expires' and question.expires_on < (now() at time zone 'Asia/Kolkata')::date)
      or assignment.marks <= 0 or assignment.negative_marks < 0
  ) into actual_question_count, actual_total_marks, invalid_question_count
  from public.mock_test_questions as assignment
  left join public.questions as question on question.id = assignment.question_id
  left join public.subjects as subject on subject.id = question.subject_id
  where assignment.mock_test_id = requested_mock_test_id;
  if actual_question_count = 0 then raise exception 'Add at least one Question before publishing.'; end if;
  if invalid_question_count > 0 then raise exception 'Every assigned Question and mark must be active and valid.'; end if;
  if actual_question_count <> test_record.target_question_count then
    raise exception 'The assigned Question count must exactly match the Mock Test target.';
  end if;
  update public.mock_tests set status = 'published', published_at = now()
  where id = requested_mock_test_id;
  return query select actual_question_count, actual_total_marks;
end;
$$;

revoke all on function public.fill_mock_test_with_latest_questions(uuid) from public;
revoke all on function public.move_mock_test_question(uuid, uuid, integer) from public;
revoke all on function public.delete_question_safely(uuid) from public;
revoke all on function public.make_question_unavailable_safely(uuid) from public;
revoke all on function public.replace_mock_test_questions_atomic(uuid, uuid, jsonb, jsonb) from public;
grant execute on function public.fill_mock_test_with_latest_questions(uuid) to authenticated;
grant execute on function public.move_mock_test_question(uuid, uuid, integer) to authenticated;
grant execute on function public.delete_question_safely(uuid) to authenticated;
grant execute on function public.make_question_unavailable_safely(uuid) to authenticated;
grant execute on function public.replace_mock_test_questions_atomic(uuid, uuid, jsonb, jsonb) to authenticated;

notify pgrst, 'reload schema';
