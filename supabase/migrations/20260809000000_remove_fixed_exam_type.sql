-- An Exam's Papers define its real format. The fixed Group/Gazetted labels are no longer needed.
drop index if exists public.exam_groups_exam_type_idx;

alter table public.exam_groups
  drop column if exists exam_type;
