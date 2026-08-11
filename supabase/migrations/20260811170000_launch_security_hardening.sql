-- Varadhi Prep launch hardening.
-- Students never need direct write access to profiles; the auth trigger creates them.
drop policy if exists "Users can update own profile" on public.profiles;
revoke all privileges on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

-- Keep identity data private while preserving each student's own dashboard access.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

-- Admin authorization is evaluated from the protected role stored in profiles.
-- Pin the search path and limit direct execution to signed-in users.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

notify pgrst, 'reload schema';
