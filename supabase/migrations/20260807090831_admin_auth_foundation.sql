-- ============================================
-- VARADHI - ADMIN AUTH FOUNDATION
-- ============================================

-- User profiles connected to Supabase Auth
create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text,

  role text not null default 'student'
    check (role in ('student', 'admin')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================
-- AUTOMATIC PROFILE CREATION
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  );

  return new;
end;
$$;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- ============================================
-- UPDATED_AT
-- ============================================

create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();


-- ============================================
-- ADMIN CHECK FUNCTION
-- ============================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


-- ============================================
-- PROFILE SECURITY
-- ============================================

alter table public.profiles enable row level security;


create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());


create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());


-- ============================================
-- ADMIN POLICIES - EXAMS
-- ============================================

create policy "Admins can manage exams"
on public.exams
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================
-- ADMIN POLICIES - EXAM GROUPS
-- ============================================

create policy "Admins can manage exam groups"
on public.exam_groups
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================
-- ADMIN POLICIES - SUBJECTS
-- ============================================

create policy "Admins can manage subjects"
on public.subjects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================
-- ADMIN POLICIES - MOCK TESTS
-- ============================================

create policy "Admins can manage mock tests"
on public.mock_tests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================
-- ADMIN POLICIES - QUESTIONS
-- ============================================

create policy "Admins can manage questions"
on public.questions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================
-- ADMIN POLICIES - MOCK TEST QUESTIONS
-- ============================================

create policy "Admins can manage mock test questions"
on public.mock_test_questions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());