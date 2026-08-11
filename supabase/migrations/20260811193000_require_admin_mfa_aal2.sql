-- Require a verified second factor for every administrator operation protected
-- by public.is_admin(). Existing RLS policies inherit this requirement without
-- duplicating MFA checks across each content table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

notify pgrst, 'reload schema';
