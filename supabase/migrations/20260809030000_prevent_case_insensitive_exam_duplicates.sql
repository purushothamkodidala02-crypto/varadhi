-- Allow the same Exam name in different categories, but not twice in one category.
create unique index if not exists exam_groups_category_name_case_insensitive_unique
on public.exam_groups (exam_id, lower(btrim(name)));
