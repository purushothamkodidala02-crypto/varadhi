alter table public.exam_groups
add column exam_type text not null default 'group'
check (
  exam_type in (
    'group',
    'gazetted',
    'non_gazetted',
    'other'
  )
);

create index if not exists exam_groups_exam_type_idx
on public.exam_groups (exam_id, exam_type, display_order);

comment on column public.exam_groups.exam_type is
'Classifies an exam entry as group, gazetted, non_gazetted, or other.';