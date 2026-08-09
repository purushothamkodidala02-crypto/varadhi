import { createClient } from "@/lib/supabase/server";
import { CreateMockTestForm } from "./CreateMockTestForm";
import { ExistingMockTestsTable } from "./ExistingMockTestsTable";

export default async function MockTestsPage() {
  const supabase = await createClient();
  const [testsResult, subjectsResult, papersResult, groupsResult, categoriesResult, specializationsResult] = await Promise.all([
    supabase.from("mock_tests").select("id, paper_id, subject_id, test_scope, title, slug, duration_minutes, status, access_type, price_inr, display_order, created_at").order("display_order"),
    supabase.from("subjects").select("id, paper_id, name"),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, duration_minutes").order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name").order("display_order"),
    supabase.from("exams").select("id, name").order("display_order"),
    supabase.from("exam_specializations").select("id, exam_group_id, name").order("display_order"),
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

  return <main><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Test builder</p><h1 className="mt-2 text-3xl font-black">Mock Tests</h1><p className="mt-2 text-slate-600">Paper-wise mocks use every Subject in a Paper. Subject-wise mocks use one selected Subject.</p></div><CreateMockTestForm categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} subjects={subjects.map((item) => ({ id: item.id, paperId: item.paper_id, name: item.name }))} />{testsResult.error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{testsResult.error.message}</p> : <ExistingMockTestsTable categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} tests={tests.map((test) => { const paper = paperById.get(test.paper_id); const exam = paper ? examById.get(paper.exam_group_id) : undefined; const subject = test.subject_id ? subjectById.get(test.subject_id) : undefined; return { id: test.id, categoryId: exam?.exam_id ?? "", examId: exam?.id ?? "", specializationId: paper?.specialization_id ?? "", paperId: paper?.id ?? "", examName: exam?.name ?? "Unknown Exam", paperName: paper ? `${paper.specialization_id ? `${specializationById.get(paper.specialization_id) ?? "Unknown Specialisation"} / ` : ""}${paper.name}` : "Unknown Paper", title: test.title, slug: test.slug, durationMinutes: test.duration_minutes, scope: test.test_scope as "paper" | "subject", subjectName: subject?.name ?? null, status: test.status as "draft" | "published" | "archived", accessType: test.access_type as "free" | "paid", priceInr: test.price_inr, createdAt: test.created_at }; })} />}</main>;
}
