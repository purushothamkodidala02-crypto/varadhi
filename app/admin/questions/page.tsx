import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/types/question";
import { CreateQuestionForm } from "./CreateQuestionForm";
import { QuestionBankTable, type QuestionBankRow } from "./QuestionBankTable";

type SubjectRecord = { id: string; exam_group_id: string; name: string; display_order: number };
type GroupRecord = { id: string; exam_id: string; name: string; display_order: number };
type ExamRecord = { id: string; name: string };
type SuitabilityRecord = { question_id: string; exam_group_id: string };

export default async function AdminQuestionsPage() {
  const supabase = await createClient();
  const [questionsResult, subjectsResult, groupsResult, examsResult, suitabilityResult] = await Promise.all([
    supabase.from("questions").select("id, subject_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, image_url, source_reference, is_active, content_lifecycle, review_on, expires_on, created_at, updated_at").order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, exam_group_id, name, display_order").order("display_order", { ascending: true }),
    supabase.from("exam_groups").select("id, exam_id, name, display_order").order("display_order", { ascending: true }),
    supabase.from("exams").select("id, name"),
    supabase.from("question_exam_groups").select("question_id, exam_group_id"),
  ]);

  const questions = (questionsResult.data ?? []) as Question[];
  const subjects = (subjectsResult.data ?? []) as SubjectRecord[];
  const groups = (groupsResult.data ?? []) as GroupRecord[];
  const exams = (examsResult.data ?? []) as ExamRecord[];
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const examMap = new Map(exams.map((exam) => [exam.id, exam]));
  const suitableGroupsByQuestion = new Map<string, string[]>();
  for (const item of (suitabilityResult.data ?? []) as SuitabilityRecord[]) {
    const group = groupMap.get(item.exam_group_id);
    if (!group) continue;
    const label = `${examMap.get(group.exam_id)?.name ?? "Unknown exam"} - ${group.name}`;
    suitableGroupsByQuestion.set(item.question_id, [...(suitableGroupsByQuestion.get(item.question_id) ?? []), label]);
  }

  const groupOptions = groups
    .map((group) => ({ id: group.id, examId: group.exam_id, name: group.name, order: group.display_order }))
    .sort((first, second) => first.order - second.order || first.name.localeCompare(second.name))
    .map(({ id, examId, name }) => ({ id, examId, name }));
  const subjectOptions = subjects
    .map((subject) => ({ id: subject.id, examGroupId: subject.exam_group_id, name: subject.name, order: subject.display_order }))
    .sort((first, second) => first.order - second.order || first.name.localeCompare(second.name))
    .map(({ id, examGroupId, name }) => ({ id, examGroupId, name }));

  const questionRows: QuestionBankRow[] = questions.map((question) => {
    const subject = question.subject_id ? subjectMap.get(question.subject_id) : undefined;
    const group = subject ? groupMap.get(subject.exam_group_id) : undefined;
    const exam = group ? examMap.get(group.exam_id) : undefined;
    return { id: question.id, questionText: question.question_text, correctAnswer: question.correct_answer, isActive: question.is_active, examName: exam?.name ?? "Unknown exam", groupName: group?.name ?? "General", subjectName: subject?.name ?? "General", subjectKey: question.subject_id ?? "general", contentLifecycle: question.content_lifecycle, reviewOn: question.review_on, expiresOn: question.expires_on, suitableGroupLabels: suitableGroupsByQuestion.get(question.id) ?? [] };
  });
  const today = new Date().toISOString().slice(0, 10);
  const activeQuestions = questions.filter((question) => question.is_active && (!question.expires_on || question.expires_on >= today)).length;
  const reviewDue = questions.filter((question) => question.content_lifecycle === "review" && question.review_on && question.review_on <= today).length;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Content library</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Question bank</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">Choose an exam first, then its entry and subject before adding a reusable question.</p></div><a href="#add-question" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800">+ Add question</a></header>
      <section className="mt-7 grid gap-4 sm:grid-cols-3">{[["Total questions", questions.length, "One reusable TGPSC library"], ["Active and ready", activeQuestions, "Available for new mock tests"], ["Review due", reviewDue, "Check these before using again"]].map(([label, value, description]) => <div key={label as string} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p><p className="mt-2 text-xs font-medium text-slate-500">{description}</p></div>)}</section>
      <CreateQuestionForm exams={exams} groups={groupOptions} subjects={subjectOptions} />
      {questionsResult.error && <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5"><p className="font-bold text-red-800">Unable to load questions</p><p className="mt-1 text-sm text-red-700">{questionsResult.error.message}</p></div>}
      {!questionsResult.error && questions.length === 0 && <section className="mt-8 rounded-2xl border border-dashed bg-white p-10 text-center"><h2 className="text-xl font-black text-slate-950">Your question bank is empty</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Use the form above to add your first question. It will be available when you build a mock test.</p></section>}
      {!questionsResult.error && questions.length > 0 && <QuestionBankTable questions={questionRows} />}
    </div>
  );
}
