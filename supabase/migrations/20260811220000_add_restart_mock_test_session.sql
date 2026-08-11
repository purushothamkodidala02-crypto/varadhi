-- Let a student explicitly discard an unfinished session and begin a fresh test.
create or replace function public.restart_mock_test_session(
  requested_mock_test_id uuid
)
returns table (
  session_id uuid,
  mock_test_id uuid,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  if not public.can_access_mock_test(requested_mock_test_id) then
    raise exception 'You do not have access to this Mock Test.';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(auth.uid()::text),
    hashtext(requested_mock_test_id::text)
  );

  delete from public.test_attempt_sessions as session
  where session.user_id = auth.uid()
    and session.mock_test_id = requested_mock_test_id
    and session.submitted_at is null;

  return query
  select started.session_id, started.mock_test_id, started.expires_at
  from public.start_mock_test_session(requested_mock_test_id) as started;
end;
$$;

revoke all on function public.restart_mock_test_session(uuid) from public;
grant execute on function public.restart_mock_test_session(uuid) to authenticated;

notify pgrst, 'reload schema';
