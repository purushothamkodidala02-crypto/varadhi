import Link from "next/link";
import { notFound } from "next/navigation";
import { EntitySeoForm } from "@/components/admin/EntitySeoForm";
import { createClient } from "@/lib/supabase/server";
import { indiaDateKey } from "@/lib/date";
import type { MockTest } from "@/types/mock-test";
import { DownloadQuestionsButton } from "../../DownloadQuestionsButton";
import { EditMockTestForm } from "./EditMockTestForm";
import { MockTestCsvImport } from "./MockTestCsvImport";
import { QuestionAssignments } from "./QuestionAssignments";

export default async function EditMockTestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string | string[] }> }) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const backHref = typeof returnTo === "string" && (returnTo === "/admin/mock-tests" || returnTo.startsWith("/admin/mock-tests?")) ? returnTo : "/admin/mock-tests";
  const supabase = await createClient();
  const [testResult, subjectsResult, papersResult, groupsResult, categoriesResult, specializationsResult, questionsResult, assignmentsResult] = await Promise.all([
    supabase.from("mock_tests").select("id, paper_id, subject_id, test_scope, series_number, title, slug, description, seo_title, seo_description, instructions, duration_minutes, target_question_count, difficulty, status, version, display_order, published_at, access_type, price_inr, created_at, updated_at").eq("id", id).maybeSingle(),
    supabase.from("subjects").select("id, paper_id, name").order("display_order"),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, duration_minutes, default_correct_marks, default_negative_marks"),
    supabase.from("exam_groups").select("id, exam_id, name"),
    supabase.from("exams").select("id, name"),
    supabase.from("exam_specializations").select("id, name"),
    supabase.from("questions").select("id, subject_id, question_text, is_active, expires_on").order("created_at", { ascending: false }),
    supabase.from("mock_test_questions").select("id, question_id, question_order, marks, negative_marks").eq("mock_test_id", id).order("question_order"),
  ]);
  if (!testResult.data) notFound();
  const test = testResult.data as MockTest;
  const subjects = subjectsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const groups = new Map((groupsResult.data ?? []).map((item) => [item.id, item]));
  const categories = new Map((categoriesResult.data ?? []).map((item) => [item.id, item]));
  const specializations = new Map((specializationsResult.data ?? []).map((item) => [item.id, item.name]));
  const subjectById = new Map(subjects.map((item) => [item.id, item]));
  const questionById = new Map((questionsResult.data ?? []).map((item) => [item.id, item]));
  const assignments = (assignmentsResult.data ?? []).map((item) => ({ ...item, question_text: questionById.get(item.question_id)?.question_text ?? "Question unavailable", is_active: questionById.get(item.question_id)?.is_active ?? false, is_score_valid: Number(item.marks) > 0 && Number(item.negative_marks) >= 0 }));
  const assignedIds = new Set(assignments.map((item) => item.question_id));
  const today = indiaDateKey();
  const availableQuestions = (questionsResult.data ?? []).filter((question) => { const subject = subjectById.get(question.subject_id); return !assignedIds.has(question.id) && question.is_active && (!question.expires_on || question.expires_on >= today) && subject?.paper_id === test.paper_id && (test.test_scope === "paper" || question.subject_id === test.subject_id); }).map((question) => ({ id: question.id, text: question.question_text }));
  const testPaper = papers.find((paper) => paper.id === test.paper_id);
  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-3"><Link href={backHref} className="text-sm font-semibold text-teal-700 hover:underline">← Back to Mock Tests</Link>{assignments.length > 0 && <DownloadQuestionsButton mockTestId={test.id} />}</div>
      <h1 className="mt-5 text-3xl font-black">Build Mock Test</h1>
      <p className="mt-2 text-slate-600">Upload a CSV to build this draft quickly, or choose individual Questions from the Question Bank.</p>
      <EditMockTestForm mockTest={test} papers={papers.map((paper) => { const group = groups.get(paper.exam_group_id); return { id: paper.id, label: `${categories.get(group?.exam_id ?? "")?.name ?? "Unknown category"} → ${group?.name ?? "Unknown Exam"}${paper.specialization_id ? ` → ${specializations.get(paper.specialization_id) ?? "Unknown Specialisation"}` : ""} → ${paper.name}`, duration: paper.duration_minutes }; })} subjects={subjects.map((subject) => ({ id: subject.id, paperId: subject.paper_id, name: subject.name }))} />
      <EntitySeoForm entityType="mock_test" entityId={test.id} title={test.seo_title} description={test.seo_description} titlePlaceholder={test.title} descriptionPlaceholder={test.description ?? "Take this free timed mock test with detailed result review."} />
      <MockTestCsvImport mockTestId={test.id} isDraft={test.status === "draft"} targetQuestionCount={test.target_question_count} assignedQuestionCount={assignments.length} paperName={testPaper?.name ?? "this Paper"} subjectName={test.subject_id ? subjectById.get(test.subject_id)?.name ?? null : null} />
      <QuestionAssignments mockTestId={test.id} isDraft={test.status === "draft"} targetQuestionCount={test.target_question_count} availableQuestions={availableQuestions} assignedQuestions={assignments} defaultMarks={testPaper?.default_correct_marks ?? 1} defaultNegativeMarks={testPaper?.default_negative_marks ?? 0} />
    </main>
  );
}
