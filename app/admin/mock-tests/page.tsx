import { MockSymbol } from "@/components/exams/CatalogSymbols";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { createClient } from "@/lib/supabase/server";
import { CreateMockTestForm } from "./CreateMockTestForm";
import { ExistingMockTestsTable } from "./ExistingMockTestsTable";

export default async function MockTestsPage() {
  const supabase = await createClient();
  const [statesResult, testsResult, subjectsResult, papersResult, groupsResult, categoriesResult, specializationsResult, assignmentsResult, questionsResult, attemptsResult] = await Promise.all([
    supabase.from("exam_states").select("id, name, code, slug").order("display_order"),
    supabase.from("mock_tests").select("id, paper_id, subject_id, test_scope, series_number, title, slug, duration_minutes, status, access_type, price_inr, display_order, created_at").order("series_number"),
    supabase.from("subjects").select("id, paper_id, name"),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, duration_minutes, display_order").order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name").order("display_order"),
    supabase.from("exams").select("id, state_id, name").order("display_order"),
    supabase.from("exam_specializations").select("id, exam_group_id, name").order("display_order"),
    supabase.from("mock_test_questions").select("mock_test_id, question_id, marks, negative_marks"),
    supabase.from("questions").select("id, is_active, expires_on"),
    supabase.from("test_attempts").select("mock_test_id"),
  ]);
  const states = statesResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const exams = groupsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const subjects = subjectsResult.data ?? [];
  const tests = testsResult.data ?? [];
  const specializations = specializationsResult.data ?? [];
  const paperDisplayById = buildPaperDisplayMap(papers as OrderedPaper[]);
  const stateById = new Map(states.map((item) => [item.id, item]));
  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const specializationById = new Map(specializations.map((item) => [item.id, item.name]));
  const paperById = new Map(papers.map((paper) => [paper.id, paper]));
  const examById = new Map(exams.map((exam) => [exam.id, exam]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const categoryOptions = categories.map((item) => ({ id: item.id, stateId: item.state_id, name: item.name }));
  const examOptions = exams.map((item) => ({ id: item.id, categoryId: item.exam_id, name: item.name }));
  const specializationOptions = specializations.map((item) => ({ id: item.id, examId: item.exam_group_id, name: item.name }));
  const paperOptions = papers.map((item) => ({ id: item.id, examId: item.exam_group_id, specializationId: item.specialization_id, name: item.name, duration: item.duration_minutes, number: paperDisplayById.get(item.id)?.number ?? 1 }));
  const today = new Date().toISOString().slice(0, 10);
  const questionById = new Map((questionsResult.data ?? []).map((item) => [item.id, item]));
  const assignmentsByTest = new Map<string, NonNullable<typeof assignmentsResult.data>>();
  for (const assignment of assignmentsResult.data ?? []) {
    const current = assignmentsByTest.get(assignment.mock_test_id) ?? [];
    current.push(assignment);
    assignmentsByTest.set(assignment.mock_test_id, current);
  }
  const attemptsByTest = new Map<string, number>();
  for (const attempt of attemptsResult.data ?? []) attemptsByTest.set(attempt.mock_test_id, (attemptsByTest.get(attempt.mock_test_id) ?? 0) + 1);
  const mappedTests = tests.map((test) => {
    const paper = paperById.get(test.paper_id);
    const exam = paper ? examById.get(paper.exam_group_id) : undefined;
    const category = exam ? categoryById.get(exam.exam_id) : undefined;
    const state = category ? stateById.get(category.state_id) : undefined;
    const subject = test.subject_id ? subjectById.get(test.subject_id) : undefined;
    const assignments = assignmentsByTest.get(test.id) ?? [];
    const usableQuestionCount = assignments.filter((assignment) => {
      const question = questionById.get(assignment.question_id);
      return question?.is_active && (!question.expires_on || question.expires_on >= today) && Number(assignment.marks) > 0 && Number(assignment.negative_marks) >= 0;
    }).length;
    return {
      id: test.id,
      stateId: state?.id ?? "",
      stateName: state?.name ?? "Unknown state",
      stateCode: state?.code ?? "—",
      categoryId: exam?.exam_id ?? "",
      examId: exam?.id ?? "",
      specializationId: paper?.specialization_id ?? "",
      paperId: paper?.id ?? "",
      examName: exam?.name ?? "Unknown Exam",
      paperName: paper ? `${paper.specialization_id ? `${specializationById.get(paper.specialization_id) ?? "Unknown Specialisation"} / ` : ""}${paperDisplayById.get(paper.id)?.label ?? paper.name}` : "Unknown Paper",
      seriesNumber: Number(test.series_number ?? 1),
      title: test.title,
      slug: test.slug,
      durationMinutes: test.duration_minutes,
      scope: test.test_scope as "paper" | "subject",
      subjectName: subject?.name ?? null,
      status: test.status as "draft" | "published" | "archived",
      questionCount: assignments.length,
      usableQuestionCount,
      totalMarks: assignments.reduce((total, assignment) => total + Number(assignment.marks), 0),
      attemptCount: attemptsByTest.get(test.id) ?? 0,
    };
  });

  return <main>
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 p-7 text-white shadow-xl shadow-teal-950/15 sm:p-9"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal-300/15 blur-3xl" /><div className="relative flex flex-wrap items-end justify-between gap-6"><div><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-teal-200"><MockSymbol className="h-4 w-4" /> Publishing workspace</p><h1 className="font-display mt-3 text-4xl">Mock-test control centre</h1><p className="mt-3 max-w-2xl leading-7 text-slate-300">Manage every TG, AP and Central test in one place. Names and series numbers stay consistent automatically.</p></div><div className="grid grid-cols-3 gap-2 text-center text-xs"><Summary value={states.length} label="States" /><Summary value={tests.length} label="Tests" /><Summary value={mappedTests.filter((test) => test.status === "published").length} label="Live" /></div></div></section>
    {testsResult.error || statesResult.error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{testsResult.error?.message ?? statesResult.error?.message}</p> : <ExistingMockTestsTable states={states} categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} tests={mappedTests} />}
    <details className="mt-8 overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-white to-teal-50 shadow-sm"><summary className="cursor-pointer list-none px-7 py-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-teal-800">Create</p><h2 className="font-display mt-2 text-xl">+ Create the next mock test</h2><p className="mt-1 text-sm text-slate-600">A guided workflow keeps the state, exam, paper and test series correct.</p></summary><div className="border-t border-teal-100 px-4 pb-7 sm:px-7"><CreateMockTestForm states={states} categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} subjects={subjects.map((item) => ({ id: item.id, paperId: item.paper_id, name: item.name }))} existingSeries={tests.map((test) => ({ paperId: test.paper_id, subjectId: test.subject_id, scope: test.test_scope as "paper" | "subject", seriesNumber: Number(test.series_number ?? 1) }))} /></div></details>
  </main>;
}

function Summary({ value, label }: { value: number; label: string }) {
  return <span className="min-w-20 rounded-xl bg-white/10 px-3 py-3"><strong className="block text-lg text-white">{value}</strong><span className="text-slate-300">{label}</span></span>;
}
