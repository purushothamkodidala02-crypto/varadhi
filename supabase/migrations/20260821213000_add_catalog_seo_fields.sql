-- Optional, administrator-controlled search metadata for every public catalogue page.
-- Empty values intentionally fall back to the existing automatic metadata.

alter table public.exam_states
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.exams
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.exam_groups
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.exam_specializations
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.papers
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.subjects
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.mock_tests
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.exam_states add constraint exam_states_seo_title_length check (seo_title is null or char_length(seo_title) <= 100);
alter table public.exam_states add constraint exam_states_seo_description_length check (seo_description is null or char_length(seo_description) <= 320);
alter table public.exams add constraint exams_seo_title_length check (seo_title is null or char_length(seo_title) <= 100);
alter table public.exams add constraint exams_seo_description_length check (seo_description is null or char_length(seo_description) <= 320);
alter table public.exam_groups add constraint exam_groups_seo_title_length check (seo_title is null or char_length(seo_title) <= 100);
alter table public.exam_groups add constraint exam_groups_seo_description_length check (seo_description is null or char_length(seo_description) <= 320);
alter table public.exam_specializations add constraint exam_specializations_seo_title_length check (seo_title is null or char_length(seo_title) <= 100);
alter table public.exam_specializations add constraint exam_specializations_seo_description_length check (seo_description is null or char_length(seo_description) <= 320);
alter table public.papers add constraint papers_seo_title_length check (seo_title is null or char_length(seo_title) <= 100);
alter table public.papers add constraint papers_seo_description_length check (seo_description is null or char_length(seo_description) <= 320);
alter table public.subjects add constraint subjects_seo_title_length check (seo_title is null or char_length(seo_title) <= 100);
alter table public.subjects add constraint subjects_seo_description_length check (seo_description is null or char_length(seo_description) <= 320);
alter table public.mock_tests add constraint mock_tests_seo_title_length check (seo_title is null or char_length(seo_title) <= 100);
alter table public.mock_tests add constraint mock_tests_seo_description_length check (seo_description is null or char_length(seo_description) <= 320);

-- Start the newly canonical Police Constable page with the search wording
-- requested by the administrator. Other records continue using automatic text.
update public.exam_groups as exam_group
set
  seo_title = 'Telangana Police Constable Mock Test 2026 – Free Online Tests',
  seo_description = 'Take free Telangana Police Constable mock tests online for preliminary written exam preparation. Practise timed questions and review answers on Varadhi Prep.'
from public.exams as category
join public.exam_states as state on state.id = category.state_id
where exam_group.exam_id = category.id
  and state.slug = 'telangana'
  and exam_group.slug = 'police-constable';
