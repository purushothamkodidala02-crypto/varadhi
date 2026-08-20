import { createClient } from "@/lib/supabase/server";
import { CreateQuestionForm } from "./CreateQuestionForm";
import { QuestionBankTable } from "./QuestionBankTable";
import { QuestionCsvImport } from "./QuestionCsvImport";

type QuestionBankSearchParams = {
  category?: string;
  exam?: string;
  specialization?: string;
  paper?: string;
  subject?: string;
  q?: string;
  page?: string;
};

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<QuestionBankSearchParams>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const [subjectsResult, papersResult, groupsResult, categoriesResult, specializationsResult] = await Promise.all([
    supabase.from("subjects").select("id, paper_id, name, content_language_mode, display_order").order("display_order"),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, display_order").order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name, display_order").order("display_order"),
    supabase.from("exams").select("id, name, display_order").order("display_order"),
    supabase.from("exam_specializations").select("id, exam_group_id, name").order("display_order"),
  ]);

  const subjects = subjectsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const exams = groupsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const specializations = specializationsResult.data ?? [];
  const categoryOptions = categories.map((item) => ({ id: item.id, name: item.name }));
  const examOptions = exams.map((item) => ({ id: item.id, categoryId: item.exam_id, name: item.name }));
  const specializationOptions = specializations.map((item) => ({ id: item.id, examId: item.exam_group_id, name: item.name }));
  const paperOptions = papers.map((item) => ({ id: item.id, examId: item.exam_group_id, specializationId: item.specialization_id, name: item.name }));
  const subjectOptions = subjects.map((item) => ({ id: item.id, paperId: item.paper_id, name: item.name, contentLanguageMode: item.content_language_mode }));
  const categoryId = categoryOptions.some((item) => item.id === query.category) ? query.category ?? "" : "";
  const examId = examOptions.some((item) => item.id === query.exam && item.categoryId === categoryId) ? query.exam ?? "" : "";
  const specializationId = specializationOptions.some((item) => item.id === query.specialization && item.examId === examId) ? query.specialization ?? "" : "";
  const paperId = paperOptions.some((item) => item.id === query.paper && item.examId === examId && item.specializationId === (specializationId || null)) ? query.paper ?? "" : "";
  const subjectId = subjectOptions.some((item) => item.id === query.subject && item.paperId === paperId) ? query.subject ?? "" : "";
  const requestedPage = Number(query.page ?? "1");
  const initialPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const initialSearch = String(query.q ?? "").trim().slice(0, 100);
  const initialLocation = { categoryId, examId, specializationId, paperId, subjectId };

  return <main><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Content library</p><h1 className="mt-2 text-3xl font-black">Question Bank</h1><p className="mt-2 text-slate-600">Questions are stored once under a Paper and Subject, then reused in paper-wise or subject-wise mocks.</p></div><CreateQuestionForm categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} subjects={subjectOptions} /><QuestionCsvImport categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} /><QuestionBankTable categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} subjects={subjectOptions} initialLocation={initialLocation} initialSearch={initialSearch} initialPage={initialPage} /></main>;
}
