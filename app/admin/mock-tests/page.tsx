import { createClient } from "@/lib/supabase/server";
import { CreateMockTestForm } from "./CreateMockTestForm";
import { ExistingMockTestsTable } from "./ExistingMockTestsTable";

export default async function MockTestsPage() {
  const supabase = await createClient();
  const [testsResult, subjectsResult, papersResult, groupsResult, categoriesResult, specializationsResult, assignmentsResult, questionsResult, attemptsResult] = await Promise.all([
    supabase.from("mock_tests").select("id, paper_id, subject_id, test_scope, title, slug, duration_minutes, status, access_type, price_inr, display_order, created_at").order("display_order"),
    supabase.from("subjects").select("id, paper_id, name"),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, duration_minutes").order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name").order("display_order"),
    supabase.from("exams").select("id, name").order("display_order"),
    supabase.from("exam_specializations").select("id, exam_group_id, name").order("display_order"),
    supabase.from("mock_test_questions").select("mock_test_id, question_id, marks, negative_marks"),
    supabase.from("questions").select("id, is_active, expires_on"),
    supabase.from("test_attempts").select("mock_test_id"),
  ]);

  const categories = categoriesResult.data ?? [];
  const exams = groupsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const subjects = subjectsResult.data ?? [];
  const tests = testsResult.data ?? [];
  const specializations = specializationsResult.data ?? [];
  const specializationById = new Map(specializations.map((item) => [item.id, item.name]));
  const paperById = new Map(papers.map((paper) => [paper.id, paper]));
  const examById = new Map(exams.map((exam) => [exam.id, exam]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const categoryOptions = categories.map((item) => ({ id: item.id, name: item.name }));
  const examOptions = exams.map((item) => ({ id: item.id, categoryId: item.exam_id, name: item.name }));
  const specializationOptions = specializations.map((item) => ({ id: item.id, examId: item.exam_group_id, name: item.name }));
  const paperOptions = papers.map((item) => ({ id: item.id, examId: item.exam_group_id, specializationId: item.specialization_id, name: item.name, duration: item.duration_minutes }));
  const today = new Date().toISOString().slice(0, 10);
  const questionById = new Map((questionsResult.data ?? []).map((item) => [item.id, item]));
  const assignmentsByTest = new Map<string, typeof assignmentsResult.data>();
  for (const assignment of assignmentsResult.data ?? []) {
    const current = assignmentsByTest.get(assignment.mock_test_id) ?? [];
    current.push(assignment);
    assignmentsByTest.set(assignment.mock_test_id, current);
  }
  const attemptsByTest = new Map<string, number>();
  for (const attempt of attemptsResult.data ?? []) attemptsByTest.set(attempt.mock_test_id, (attemptsByTest.get(attempt.mock_test_id) ?? 0) + 1);

  return <main><div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 p-7 text-white shadow-xl shadow-teal-950/15 sm:p-8"><div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-300/15 blur-3xl" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-200">Publishing workspace</p><h1 className="mt-2 text-3xl font-black">Mock Tests</h1><p className="mt-2 max-w-2xl text-slate-300">Build tests here, check their readiness, and control exactly what students can see.</p></div></div>{testsResult.error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{testsResult.error.message}</p> : <ExistingMockTestsTable categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} tests={tests.map((test) => { const paper = paperById.get(test.paper_id); const exam = paper ? examById.get(paper.exam_group_id) : undefined; const subject = test.subject_id ? subjectById.get(test.subject_id) : undefined; const assignments = assignmentsByTest.get(test.id) ?? []; const usableQuestionCount = assignments.filter((assignment) => { const question = questionById.get(assignment.question_id); return question?.is_active && (!question.expires_on || question.expires_on >= today) && Number(assignment.marks) > 0 && Number(assignment.negative_marks) >= 0; }).length; return { id: test.id, categoryId: exam?.exam_id ?? "", examId: exam?.id ?? "", specializationId: paper?.specialization_id ?? "", paperId: paper?.id ?? "", examName: exam?.name ?? "Unknown Exam", paperName: paper ? `${paper.specialization_id ? `${specializationById.get(paper.specialization_id) ?? "Unknown Specialisation"} / ` : ""}${paper.name}` : "Unknown Paper", title: test.title, slug: test.slug, durationMinutes: test.duration_minutes, scope: test.test_scope as "paper" | "subject", subjectName: subject?.name ?? null, status: test.status as "draft" | "published" | "archived", questionCount: assignments.length, usableQuestionCount, totalMarks: assignments.reduce((total, assignment) => total + Number(assignment.marks), 0), attemptCount: attemptsByTest.get(test.id) ?? 0 }; })} />}<details className="mt-8 overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-white to-teal-50 shadow-sm"><summary className="cursor-pointer list-none px-7 py-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Create</p><h2 className="mt-2 text-xl font-black">+ Create a new mock test</h2><p className="mt-1 text-sm text-slate-600">New tests start as drafts and stay invisible until they are ready.</p></summary><div className="border-t border-teal-100 px-7 pb-7"><CreateMockTestForm categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} subjects={subjects.map((item) => ({ id: item.id, paperId: item.paper_id, name: item.name }))} /></div></details></main>;
}
