-- Keep the public Police Constable collection at the concise requested URL.
update public.exam_groups as exam_group
set slug = 'police-constable'
where exam_group.slug = 'telangana-police-mock-test'
  and not exists (
    select 1
    from public.exam_groups as conflicting
    where conflicting.exam_id = exam_group.exam_id
      and conflicting.id <> exam_group.id
      and conflicting.slug = 'police-constable'
  );
