-- ============================================
-- VARADHI - INITIAL DATABASE SCHEMA
-- ============================================

-- Enable UUID generation
create extension if not exists "pgcrypto";


-- ============================================
-- EXAMS
-- Example: TGPSC
-- ============================================

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================
-- EXAM GROUPS
-- Example:
-- Group I
-- Group II
-- Group III
-- Group IV
-- ============================================

create table public.exam_groups (
  id uuid primary key default gen_random_uuid(),

  exam_id uuid not null
    references public.exams(id)
    on delete cascade,

  name text not null,
  slug text not null,
  description text,

  is_active boolean not null default true,
  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (exam_id, slug)
);


-- ============================================
-- SUBJECTS
-- Example:
-- Current Affairs
-- Indian Polity
-- Geography
-- Logical Reasoning
-- ============================================

create table public.subjects (
  id uuid primary key default gen_random_uuid(),

  exam_group_id uuid not null
    references public.exam_groups(id)
    on delete cascade,

  name text not null,
  slug text not null,
  description text,

  is_active boolean not null default true,
  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (exam_group_id, slug)
);


-- ============================================
-- MOCK TESTS
-- ============================================

create table public.mock_tests (
  id uuid primary key default gen_random_uuid(),

  exam_group_id uuid not null
    references public.exam_groups(id)
    on delete cascade,

  subject_id uuid
    references public.subjects(id)
    on delete set null,

  title text not null,
  slug text not null,

  description text,
  instructions text,

  duration_minutes integer not null default 60
    check (duration_minutes > 0),

  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard', 'mixed')),

  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),

  version integer not null default 1,

  display_order integer not null default 0,

  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (exam_group_id, slug)
);


-- ============================================
-- QUESTION BANK
-- ============================================

create table public.questions (
  id uuid primary key default gen_random_uuid(),

  subject_id uuid
    references public.subjects(id)
    on delete set null,

  question_text text not null,

  question_type text not null default 'mcq'
    check (question_type in ('mcq')),

  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,

  correct_answer text not null
    check (correct_answer in ('A', 'B', 'C', 'D')),

  explanation text,

  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard')),

  image_url text,
  source_reference text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================
-- CONNECT QUESTIONS TO MOCK TESTS
-- ============================================

create table public.mock_test_questions (
  id uuid primary key default gen_random_uuid(),

  mock_test_id uuid not null
    references public.mock_tests(id)
    on delete cascade,

  question_id uuid not null
    references public.questions(id)
    on delete cascade,

  question_order integer not null
    check (question_order > 0),

  marks numeric(6,2) not null default 1,

  negative_marks numeric(6,2) not null default 0,

  created_at timestamptz not null default now(),

  unique (mock_test_id, question_id),
  unique (mock_test_id, question_order)
);


-- ============================================
-- INDEXES
-- Improve database performance
-- ============================================

create index idx_exam_groups_exam_id
on public.exam_groups(exam_id);

create index idx_subjects_exam_group_id
on public.subjects(exam_group_id);

create index idx_mock_tests_exam_group_id
on public.mock_tests(exam_group_id);

create index idx_mock_tests_subject_id
on public.mock_tests(subject_id);

create index idx_mock_tests_status
on public.mock_tests(status);

create index idx_questions_subject_id
on public.questions(subject_id);

create index idx_mock_test_questions_mock_test_id
on public.mock_test_questions(mock_test_id);

create index idx_mock_test_questions_question_id
on public.mock_test_questions(question_id);


-- ============================================
-- AUTOMATIC updated_at FUNCTION
-- ============================================

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================
-- AUTOMATIC updated_at TRIGGERS
-- ============================================

create trigger update_exams_updated_at
before update on public.exams
for each row
execute function public.update_updated_at_column();

create trigger update_exam_groups_updated_at
before update on public.exam_groups
for each row
execute function public.update_updated_at_column();

create trigger update_subjects_updated_at
before update on public.subjects
for each row
execute function public.update_updated_at_column();

create trigger update_mock_tests_updated_at
before update on public.mock_tests
for each row
execute function public.update_updated_at_column();

create trigger update_questions_updated_at
before update on public.questions
for each row
execute function public.update_updated_at_column();