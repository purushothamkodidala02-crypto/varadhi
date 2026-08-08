-- Scoring is configured once for a Paper and prefilled when its questions are assigned to a Mock Test.
alter table public.papers
  add column if not exists default_correct_marks numeric(6,2) not null default 1
    check (default_correct_marks > 0);
