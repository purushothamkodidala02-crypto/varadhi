-- Treat category names such as TGPSC and tgpsc as the same value.
create unique index if not exists exams_name_case_insensitive_unique
on public.exams (lower(btrim(name)));
