-- Keep public catalogue URLs stable and preserve every previous slug.

create table if not exists public.public_slug_aliases (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('state', 'category', 'exam', 'specialization', 'paper', 'subject', 'mock_test')),
  entity_id uuid not null,
  parent_id uuid,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*-?$'),
  created_at timestamptz not null default now()
);

create unique index if not exists public_slug_aliases_scope_unique
on public.public_slug_aliases (entity_type, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create index if not exists public_slug_aliases_entity_idx
on public.public_slug_aliases (entity_type, entity_id);

alter table public.public_slug_aliases enable row level security;

drop policy if exists "Public can read slug aliases" on public.public_slug_aliases;
create policy "Public can read slug aliases"
on public.public_slug_aliases for select
to anon, authenticated
using (true);

create or replace function public.remember_previous_public_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  alias_parent uuid;
begin
  if new.slug is distinct from old.slug then
    if tg_nargs > 1 and tg_argv[1] <> '' then
      alias_parent := nullif(to_jsonb(old) ->> tg_argv[1], '')::uuid;
    end if;
    insert into public.public_slug_aliases (entity_type, entity_id, parent_id, slug)
    values (tg_argv[0], old.id, alias_parent, old.slug)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists remember_exam_state_slug on public.exam_states;
create trigger remember_exam_state_slug before update of slug on public.exam_states
for each row execute function public.remember_previous_public_slug('state', '');

drop trigger if exists remember_exam_category_slug on public.exams;
create trigger remember_exam_category_slug before update of slug on public.exams
for each row execute function public.remember_previous_public_slug('category', 'state_id');

drop trigger if exists remember_exam_group_slug on public.exam_groups;
create trigger remember_exam_group_slug before update of slug on public.exam_groups
for each row execute function public.remember_previous_public_slug('exam', 'exam_id');

drop trigger if exists remember_specialization_slug on public.exam_specializations;
create trigger remember_specialization_slug before update of slug on public.exam_specializations
for each row execute function public.remember_previous_public_slug('specialization', 'exam_group_id');

drop trigger if exists remember_paper_slug on public.papers;
create trigger remember_paper_slug before update of slug on public.papers
for each row execute function public.remember_previous_public_slug('paper', 'exam_group_id');

drop trigger if exists remember_subject_slug on public.subjects;
create trigger remember_subject_slug before update of slug on public.subjects
for each row execute function public.remember_previous_public_slug('subject', 'paper_id');

drop trigger if exists remember_mock_test_slug on public.mock_tests;
create trigger remember_mock_test_slug before update of slug on public.mock_tests
for each row execute function public.remember_previous_public_slug('mock_test', 'paper_id');

-- Preserve the first readable exam-collection URLs released before permanent
-- database slugs were introduced.
insert into public.public_slug_aliases (entity_type, entity_id, parent_id, slug)
select
  'exam',
  exam_group.id,
  exam_group.exam_id,
  trim(both '-' from regexp_replace(lower(regexp_replace(exam_group.name, '\s*\([^)]*\)\s*$', '')), '[^a-z0-9]+', '-', 'g')) || '-mock-tests'
from public.exam_groups as exam_group
on conflict do nothing;

-- Expand abbreviated legacy exam slugs (for example "eo") into permanent,
-- descriptive segments (for example "executive-officer").
update public.exam_groups as exam_group
set slug = trim(both '-' from regexp_replace(lower(regexp_replace(exam_group.name, '\s*\([^)]*\)\s*$', '')), '[^a-z0-9]+', '-', 'g'))
where exam_group.slug is distinct from trim(both '-' from regexp_replace(lower(regexp_replace(exam_group.name, '\s*\([^)]*\)\s*$', '')), '[^a-z0-9]+', '-', 'g'));

-- Give published test URLs concise permanent segments. The trigger above keeps
-- every previous slug as a 308-compatible alias.
with invalid_subjects as (
  select
    subject.id,
    subject.paper_id,
    coalesce(nullif(trim(both '-' from regexp_replace(lower(subject.name), '[^a-z0-9]+', '-', 'g')), ''), 'subject') as readable_slug,
    row_number() over (
      partition by subject.paper_id, coalesce(nullif(trim(both '-' from regexp_replace(lower(subject.name), '[^a-z0-9]+', '-', 'g')), ''), 'subject')
      order by subject.id
    ) as duplicate_order
  from public.subjects as subject
  where subject.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
)
update public.subjects as subject
set slug = invalid_subject.readable_slug
from invalid_subjects as invalid_subject
where subject.id = invalid_subject.id
  and invalid_subject.duplicate_order = 1
  and not exists (
    select 1
    from public.subjects as existing
    where existing.paper_id = invalid_subject.paper_id
      and existing.id <> invalid_subject.id
      and existing.slug = invalid_subject.readable_slug
  );

update public.subjects as subject
set slug = coalesce(nullif(trim(both '-' from regexp_replace(lower(subject.name), '[^a-z0-9]+', '-', 'g')), ''), 'subject')
  || '-' || left(replace(subject.id::text, '-', ''), 8)
where subject.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';

update public.mock_tests as mock_test
set slug = case
  when mock_test.subject_id is null then 'mock-test-' || lpad(mock_test.series_number::text, 2, '0')
  else coalesce((select subject.slug from public.subjects as subject where subject.id = mock_test.subject_id), 'subject') || '-mock-test-' || lpad(mock_test.series_number::text, 2, '0')
end
where mock_test.slug is distinct from case
  when mock_test.subject_id is null then 'mock-test-' || lpad(mock_test.series_number::text, 2, '0')
  else coalesce((select subject.slug from public.subjects as subject where subject.id = mock_test.subject_id), 'subject') || '-mock-test-' || lpad(mock_test.series_number::text, 2, '0')
end;

-- All public segments use lowercase words separated by single hyphens.
alter table public.exam_states drop constraint if exists exam_states_slug_format;
alter table public.exam_states add constraint exam_states_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
alter table public.exams drop constraint if exists exams_slug_format;
alter table public.exams add constraint exams_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
alter table public.exam_groups drop constraint if exists exam_groups_slug_format;
alter table public.exam_groups add constraint exam_groups_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and slug not in ('attempt', 'category', 'opengraph-image'));
alter table public.exam_specializations drop constraint if exists exam_specializations_slug_format;
alter table public.exam_specializations add constraint exam_specializations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
alter table public.papers drop constraint if exists papers_slug_format;
alter table public.papers add constraint papers_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and slug not in ('attempt', 'subject', 'specialization', 'opengraph-image'));
alter table public.subjects drop constraint if exists subjects_slug_format;
alter table public.subjects add constraint subjects_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
alter table public.mock_tests drop constraint if exists mock_tests_slug_format;
alter table public.mock_tests add constraint mock_tests_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and slug not in ('attempt', 'subject', 'specialization', 'opengraph-image'));

revoke insert, update, delete on public.public_slug_aliases from anon, authenticated;
grant select on public.public_slug_aliases to anon, authenticated;
