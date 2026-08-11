import { createClient } from "@/lib/supabase/server";
import { CreateQuestionForm } from "./CreateQuestionForm";
import { QuestionBankTable } from "./QuestionBankTable";
import { QuestionCsvImport } from "./QuestionCsvImport";

export default async function QuestionsPage() {
  const supabase = await createClient();
  const [subjectsResult, papersResult, groupsResult, categoriesResult, specializationsResult] = await Promise.all([
    supabase.from("subjects").select("id, paper_id, name, display_order").order("display_order"),
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
  const subjectOptions = subjects.map((item) => ({ id: item.id, paperId: item.paper_id, name: item.name }));
  return <main><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Content library</p><h1 className="mt-2 text-3xl font-black">Question Bank</h1><p className="mt-2 text-slate-600">Questions are stored once under a Paper and Subject, then reused in paper-wise or subject-wise mocks.</p></div><CreateQuestionForm categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} subjects={subjectOptions} /><QuestionCsvImport categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} /><QuestionBankTable categories={categoryOptions} exams={examOptions} specializations={specializationOptions} papers={paperOptions} subjects={subjectOptions} /></main>;
}
