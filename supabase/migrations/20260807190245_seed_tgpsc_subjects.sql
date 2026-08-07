with subject_seed (
  group_slug,
  name,
  slug,
  description,
  display_order
) as (
  values
    -- Group I
    (
      'group-i',
      'Current Affairs',
      'current-affairs',
      'Regional, National and International Current Affairs',
      1
    ),
    (
      'group-i',
      'International Relations and Events',
      'international-relations-and-events',
      'International Relations and Events',
      2
    ),
    (
      'group-i',
      'Science and Technology',
      'science-and-technology',
      'India''s Achievements in Science and Technology',
      3
    ),
    (
      'group-i',
      'Environmental Issues and Disaster Management',
      'environmental-issues-and-disaster-management',
      'Disaster Management, Prevention and Mitigation Strategies',
      4
    ),
    (
      'group-i',
      'Economic and Social Development of India',
      'economic-and-social-development-of-india',
      'Economic and Social Development of India',
      5
    ),
    (
      'group-i',
      'Geography',
      'geography',
      'World Geography, Indian Geography and Geography of Telangana',
      6
    ),
    (
      'group-i',
      'History and Cultural Heritage of India',
      'history-and-cultural-heritage-of-india',
      'History and Cultural Heritage of India',
      7
    ),
    (
      'group-i',
      'Indian Constitution and Polity',
      'indian-constitution-and-polity',
      'Indian Constitution and Polity',
      8
    ),
    (
      'group-i',
      'Governance and Public Policy in India',
      'governance-and-public-policy-in-india',
      'Governance and Public Policy in India',
      9
    ),
    (
      'group-i',
      'Policies of Telangana State',
      'policies-of-telangana-state',
      'Policies of Telangana State',
      10
    ),
    (
      'group-i',
      'Telangana Society, Culture, Heritage, Arts and Literature',
      'telangana-society-culture-heritage-arts-and-literature',
      'Society, Culture, Heritage, Arts and Literature of Telangana',
      11
    ),
    (
      'group-i',
      'Social Exclusion and Inclusive Policies',
      'social-exclusion-and-inclusive-policies',
      'Social Exclusion, Rights Issues and Inclusive Policies',
      12
    ),
    (
      'group-i',
      'Logical Reasoning and Data Interpretation',
      'logical-reasoning-and-data-interpretation',
      'Logical Reasoning, Analytical Ability and Data Interpretation',
      13
    ),

    -- Group II
    (
      'group-ii',
      'Current Affairs',
      'current-affairs',
      'Regional, National and International Current Affairs',
      1
    ),
    (
      'group-ii',
      'International Relations and Events',
      'international-relations-and-events',
      'International Relations and Events',
      2
    ),
    (
      'group-ii',
      'General Science and Technology',
      'general-science-and-technology',
      'General Science and Science and Technology',
      3
    ),
    (
      'group-ii',
      'Environmental Issues and Disaster Management',
      'environmental-issues-and-disaster-management',
      'Environmental Issues and Disaster Management',
      4
    ),
    (
      'group-ii',
      'Economic and Social Development',
      'economic-and-social-development',
      'Economic and Social Development',
      5
    ),
    (
      'group-ii',
      'Geography',
      'geography',
      'World Geography, Indian Geography and Telangana Geography',
      6
    ),
    (
      'group-ii',
      'Telangana Society, Culture, Heritage, Arts and Literature',
      'telangana-society-culture-heritage-arts-and-literature',
      'Society, Culture, Heritage, Arts and Literature of Telangana',
      7
    ),
    (
      'group-ii',
      'Policies of Telangana State',
      'policies-of-telangana-state',
      'Policies of Telangana State',
      8
    ),
    (
      'group-ii',
      'Social Exclusion and Inclusive Policies',
      'social-exclusion-and-inclusive-policies',
      'Social Exclusion and Inclusive Policies',
      9
    ),
    (
      'group-ii',
      'Logical Reasoning and Data Interpretation',
      'logical-reasoning-and-data-interpretation',
      'Logical Reasoning, Analytical Ability and Data Interpretation',
      10
    ),
    (
      'group-ii',
      'Basic English',
      'basic-english',
      'Basic English at 10th Class Standard',
      11
    ),

    -- Group III
    (
      'group-iii',
      'Current Affairs',
      'current-affairs',
      'Regional, National and International Current Affairs',
      1
    ),
    (
      'group-iii',
      'International Relations and Events',
      'international-relations-and-events',
      'International Relations and Events',
      2
    ),
    (
      'group-iii',
      'General Science and Technology',
      'general-science-and-technology',
      'General Science and Science and Technology',
      3
    ),
    (
      'group-iii',
      'Environmental Issues and Disaster Management',
      'environmental-issues-and-disaster-management',
      'Environmental Issues and Disaster Management',
      4
    ),
    (
      'group-iii',
      'Geography',
      'geography',
      'World Geography, Indian Geography and Telangana Geography',
      5
    ),
    (
      'group-iii',
      'History and Cultural Heritage of India',
      'history-and-cultural-heritage-of-india',
      'History and Cultural Heritage of India',
      6
    ),
    (
      'group-iii',
      'Telangana Society, Culture, Heritage, Arts and Literature',
      'telangana-society-culture-heritage-arts-and-literature',
      'Society, Culture, Heritage, Arts and Literature of Telangana',
      7
    ),
    (
      'group-iii',
      'Policies of Telangana State',
      'policies-of-telangana-state',
      'Policies of Telangana State',
      8
    ),
    (
      'group-iii',
      'Social Exclusion and Inclusive Policies',
      'social-exclusion-and-inclusive-policies',
      'Social Exclusion and Inclusive Policies',
      9
    ),
    (
      'group-iii',
      'Logical Reasoning and Data Interpretation',
      'logical-reasoning-and-data-interpretation',
      'Logical Reasoning, Analytical Ability and Data Interpretation',
      10
    ),
    (
      'group-iii',
      'Basic English',
      'basic-english',
      'Basic English at 8th Class Standard',
      11
    ),

    -- Group IV
    (
      'group-iv',
      'Current Affairs',
      'current-affairs',
      'Regional, National and International Current Affairs',
      1
    ),
    (
      'group-iv',
      'International Relations and Events',
      'international-relations-and-events',
      'International Relations and Events',
      2
    ),
    (
      'group-iv',
      'General Science in Everyday Life',
      'general-science-in-everyday-life',
      'General Science in Everyday Life',
      3
    ),
    (
      'group-iv',
      'Environmental Issues and Disaster Management',
      'environmental-issues-and-disaster-management',
      'Environmental Issues and Disaster Management',
      4
    ),
    (
      'group-iv',
      'Geography and Economy of India and Telangana',
      'geography-and-economy-of-india-and-telangana',
      'Geography and Economy of India and Telangana',
      5
    ),
    (
      'group-iv',
      'Indian Constitution',
      'indian-constitution',
      'Salient Features of the Indian Constitution',
      6
    ),
    (
      'group-iv',
      'Indian Political System and Government',
      'indian-political-system-and-government',
      'Indian Political System and Government',
      7
    ),
    (
      'group-iv',
      'Modern Indian History',
      'modern-indian-history',
      'Modern Indian History with focus on the Indian National Movement',
      8
    ),
    (
      'group-iv',
      'History of Telangana and Telangana Movement',
      'history-of-telangana-and-telangana-movement',
      'History of Telangana and Telangana Movement',
      9
    ),
    (
      'group-iv',
      'Telangana Society, Culture, Heritage, Arts and Literature',
      'telangana-society-culture-heritage-arts-and-literature',
      'Society, Culture, Heritage, Arts and Literature of Telangana',
      10
    ),
    (
      'group-iv',
      'Policies of Telangana State',
      'policies-of-telangana-state',
      'Policies of Telangana State',
      11
    )
)
insert into public.subjects (
  exam_group_id,
  name,
  slug,
  description,
  is_active,
  display_order
)
select
  exam_groups.id,
  subject_seed.name,
  subject_seed.slug,
  subject_seed.description,
  true,
  subject_seed.display_order
from subject_seed
join public.exam_groups
  on exam_groups.slug = subject_seed.group_slug
join public.exams
  on exams.id = exam_groups.exam_id
  and exams.slug = 'tgpsc'
on conflict (exam_group_id, slug)
do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  display_order = excluded.display_order,
  updated_at = now();