-- ============================================
-- VARADHI - ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all content tables
alter table public.exams enable row level security;
alter table public.exam_groups enable row level security;
alter table public.subjects enable row level security;
alter table public.mock_tests enable row level security;
alter table public.questions enable row level security;
alter table public.mock_test_questions enable row level security;


-- ============================================
-- PUBLIC READ ACCESS
-- ============================================

-- Anyone can view active exams
create policy "Public can view active exams"
on public.exams
for select
using (is_active = true);


-- Anyone can view active exam groups
create policy "Public can view active exam groups"
on public.exam_groups
for select
using (is_active = true);


-- Anyone can view active subjects
create policy "Public can view active subjects"
on public.subjects
for select
using (is_active = true);


-- Anyone can view published mock tests
create policy "Public can view published mock tests"
on public.mock_tests
for select
using (status = 'published');


-- ============================================
-- IMPORTANT SECURITY RULE
-- ============================================

-- Do NOT create public SELECT policies for:
--
-- questions
-- mock_test_questions
--
-- Questions contain correct_answer.
-- We do not want students downloading correct answers
-- directly from Supabase.
--
-- Test questions will later be delivered through
-- secure server-side code that removes correct answers.