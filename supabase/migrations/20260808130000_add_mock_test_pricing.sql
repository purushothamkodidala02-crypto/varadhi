alter table public.mock_tests
  add column access_type text not null default 'free'
    check (access_type in ('free', 'paid')),
  add column price_inr numeric(8,2);

alter table public.mock_tests
  add constraint mock_tests_pricing_check
  check (
    (access_type = 'free' and price_inr is null)
    or (access_type = 'paid' and price_inr is not null and price_inr > 0)
  );
