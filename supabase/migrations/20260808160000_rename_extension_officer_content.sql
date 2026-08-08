-- Present the Extension Officer content with clear student-facing names.
-- Slugs and identifiers stay unchanged so existing links and attempts remain valid.

update public.exam_groups
set
  name = 'Extension Officer (EO)',
  description = 'Mock tests for Extension Officer recruitment.'
where slug = 'eo';

update public.subjects
set name = 'General Studies'
where slug = 'general-studies'
  and exam_group_id in (
    select id
    from public.exam_groups
    where slug = 'eo'
  );

update public.mock_tests
set
  title = 'General Studies Mock Test 1',
  description = 'Practice General Studies questions for Extension Officer (EO).'
where lower(title) = 'general studies'
  and exam_group_id in (
    select id
    from public.exam_groups
    where slug = 'eo'
  );
