-- A Paper can have each Subject only once, regardless of capitalization.
create unique index if not exists subjects_paper_name_case_insensitive_unique
on public.subjects (paper_id, lower(btrim(name)));
