-- Add a student-facing State -> Exam -> Paper -> Mock hierarchy without
-- removing or renaming any existing exam content.
create table public.exam_states (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_states_name_not_blank check (length(trim(name)) > 0),
  constraint exam_states_code_format check (code ~ '^[A-Z0-9]{2,8}$'),
  constraint exam_states_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create trigger update_exam_states_updated_at
before update on public.exam_states
for each row execute function public.update_updated_at_column();

create unique index uq_exam_states_name_ci
  on public.exam_states(lower(trim(name)));

create unique index uq_exam_states_code
  on public.exam_states(code);

alter table public.exam_states enable row level security;

create policy "Public can view active exam states"
on public.exam_states for select
using (is_active = true);

create policy "Admins can manage exam states"
on public.exam_states for all to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.exam_states (name, code, slug, description, display_order)
values
  ('Telangana', 'TG', 'telangana', 'Telangana state recruitment and eligibility examinations.', 1),
  ('Andhra Pradesh', 'AP', 'andhra-pradesh', 'Andhra Pradesh state recruitment and eligibility examinations.', 2),
  ('Central / All India', 'IN', 'central', 'Central government and all-India examinations.', 3)
on conflict (slug) do nothing;

alter table public.exams
  add column state_id uuid references public.exam_states(id) on delete restrict;

update public.exams
set state_id = (
  select id from public.exam_states where slug = 'telangana'
)
where state_id is null;

alter table public.exams alter column state_id set not null;

create index idx_exams_state_id_display
  on public.exams(state_id, display_order, name);

alter table public.mock_tests add column series_number integer;

with numbered as (
  select
    id,
    row_number() over (
      partition by paper_id, test_scope, coalesce(subject_id, '00000000-0000-0000-0000-000000000000'::uuid)
      order by display_order, created_at, id
    ) as number
  from public.mock_tests
)
update public.mock_tests as mock_test
set series_number = numbered.number
from numbered
where numbered.id = mock_test.id;

alter table public.mock_tests
  alter column series_number set not null,
  add constraint mock_tests_series_number_positive check (series_number > 0);

create unique index uq_mock_tests_paper_series
  on public.mock_tests(paper_id, series_number)
  where test_scope = 'paper';

create unique index uq_mock_tests_subject_series
  on public.mock_tests(subject_id, series_number)
  where test_scope = 'subject';

notify pgrst, 'reload schema';
