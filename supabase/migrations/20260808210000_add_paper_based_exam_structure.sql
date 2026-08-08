-- Varadhi hierarchy:
-- Exam Category -> Exam -> Paper -> Subject -> Question
-- The previous data has been deliberately cleared before this migration.

create table public.papers (
  id uuid primary key default gen_random_uuid(),
  exam_group_id uuid not null
    references public.exam_groups(id)
    on delete cascade,
  name text not null,
  slug text not null,
  description text,
  duration_minutes integer,
  question_count integer,
  default_negative_marks numeric(6,2) not null default 0
    check (default_negative_marks >= 0),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_group_id, slug),
  check (duration_minutes is null or duration_minutes > 0),
  check (question_count is null or question_count > 0)
);

create index idx_papers_exam_group_id
  on public.papers(exam_group_id, display_order);

alter table public.papers enable row level security;

create policy "Public can view active papers"
on public.papers for select
using (is_active = true);

create policy "Admins can manage papers"
on public.papers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create trigger update_papers_updated_at
before update on public.papers
for each row
execute function public.update_updated_at_column();

-- Subjects now belong to a Paper, not directly to an Exam.
alter table public.subjects
  add column paper_id uuid references public.papers(id) on delete cascade;

alter table public.subjects
  drop constraint if exists subjects_exam_group_id_slug_key;

drop index if exists public.idx_subjects_exam_group_id;

alter table public.subjects
  drop column exam_group_id;

alter table public.subjects
  alter column paper_id set not null,
  add constraint subjects_paper_id_slug_key unique (paper_id, slug);

create index idx_subjects_paper_id
  on public.subjects(paper_id, display_order);

-- A Mock Test targets one Paper. A Subject is present only for a subject-wise test.
alter table public.mock_tests
  add column paper_id uuid references public.papers(id) on delete cascade,
  add column test_scope text not null default 'paper'
    check (test_scope in ('paper', 'subject'));

alter table public.mock_tests
  drop constraint if exists mock_tests_exam_group_id_slug_key;

drop index if exists public.idx_mock_tests_exam_group_id;

alter table public.mock_tests
  drop column exam_group_id;

alter table public.mock_tests
  alter column paper_id set not null,
  add constraint mock_tests_paper_id_slug_key unique (paper_id, slug),
  add constraint mock_tests_scope_subject_check
    check (
      (test_scope = 'paper' and subject_id is null)
      or (test_scope = 'subject' and subject_id is not null)
    );

create index idx_mock_tests_paper_id
  on public.mock_tests(paper_id, display_order);

-- Questions are now always classified to one Subject under one Paper.
alter table public.questions
  alter column subject_id set not null;

-- Old cross-exam suitability conflicts with the new single-paper classification.
drop table if exists public.question_exam_groups;

-- Enforce that a subject-wise Mock Test uses a Subject from its selected Paper.
create or replace function public.validate_mock_test_target()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  subject_paper_id uuid;
begin
  if new.test_scope = 'paper' and new.subject_id is not null then
    raise exception 'Paper-wise Mock Tests cannot have a Subject.';
  end if;

  if new.test_scope = 'subject' then
    select paper_id into subject_paper_id
    from public.subjects
    where id = new.subject_id;

    if subject_paper_id is null or subject_paper_id <> new.paper_id then
      raise exception 'The selected Subject must belong to the selected Paper.';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_mock_test_target_trigger
before insert or update of paper_id, subject_id, test_scope
on public.mock_tests
for each row
execute function public.validate_mock_test_target();
