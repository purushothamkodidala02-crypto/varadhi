-- Some exams, such as AEE, have separate technical branches. This optional
-- layer keeps AEE together while allowing each branch to have its own Papers.
create table public.exam_specializations (
  id uuid primary key default gen_random_uuid(),
  exam_group_id uuid not null references public.exam_groups(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_group_id, slug)
);

create index idx_exam_specializations_exam_group_id
  on public.exam_specializations (exam_group_id, display_order);

alter table public.exam_specializations enable row level security;

create policy "Public can view active exam specializations"
on public.exam_specializations for select
using (is_active = true);

create policy "Admins can manage exam specializations"
on public.exam_specializations for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create trigger update_exam_specializations_updated_at
before update on public.exam_specializations
for each row execute function public.update_updated_at_column();

alter table public.papers
  add column if not exists specialization_id uuid
    references public.exam_specializations(id) on delete set null;

create index if not exists idx_papers_specialization_id
  on public.papers (specialization_id, display_order);

create or replace function public.validate_paper_specialization()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  specialization_exam_group_id uuid;
begin
  if new.specialization_id is null then
    return new;
  end if;

  select exam_group_id into specialization_exam_group_id
  from public.exam_specializations
  where id = new.specialization_id;

  if specialization_exam_group_id is null
    or specialization_exam_group_id <> new.exam_group_id then
    raise exception 'The selected Specialisation must belong to the selected Exam.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_paper_specialization_trigger on public.papers;
create trigger validate_paper_specialization_trigger
before insert or update of exam_group_id, specialization_id
on public.papers
for each row execute function public.validate_paper_specialization();
