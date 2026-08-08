-- A question remains a single record in the library. Its links below say
-- which TGPSC exam entries may reuse it; this prevents copy-and-paste content.
alter table public.questions
  add column content_lifecycle text not null default 'permanent'
    check (content_lifecycle in ('permanent', 'review', 'expires')),
  add column review_on date,
  add column expires_on date;

alter table public.questions
  add constraint questions_lifecycle_dates_check
  check (
    (content_lifecycle = 'permanent' and review_on is null and expires_on is null)
    or (content_lifecycle = 'review' and review_on is not null and expires_on is null)
    or (content_lifecycle = 'expires' and expires_on is not null and review_on is null)
  );

create table public.question_exam_groups (
  question_id uuid not null
    references public.questions(id)
    on delete cascade,
  exam_group_id uuid not null
    references public.exam_groups(id)
    on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, exam_group_id)
);

-- Existing questions remain available to the entry that owns their subject.
insert into public.question_exam_groups (question_id, exam_group_id)
select question.id, subject.exam_group_id
from public.questions as question
join public.subjects as subject on subject.id = question.subject_id
on conflict do nothing;

create index idx_questions_content_lifecycle
  on public.questions(content_lifecycle, expires_on, review_on);

create index idx_question_exam_groups_exam_group
  on public.question_exam_groups(exam_group_id);

alter table public.question_exam_groups enable row level security;

create policy "Admins can manage question exam groups"
on public.question_exam_groups
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
