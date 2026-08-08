import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/types/question";
import { CreateQuestionForm } from "./CreateQuestionForm";
import { DeleteQuestionButton } from "./DeleteQuestionButton";

type SubjectRecord = { id: string; exam_group_id: string; name: string; display_order: number };
type GroupRecord = { id: string; exam_id: string; name: string; display_order: number };
type ExamRecord = { id: string; name: string };

export default async function AdminQuestionsPage() {
  const supabase = await createClient();
  const [questionsResult, subjectsResult, groupsResult, examsResult] = await Promise.all([
    supabase
      .from("questions")
      .select("id, subject_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, image_url, source_reference, is_active, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, exam_group_id, name, display_order").order("display_order", { ascending: true }),
    supabase.from("exam_groups").select("id, exam_id, name, display_order").order("display_order", { ascending: true }),
    supabase.from("exams").select("id, name"),
  ]);

  const questions = (questionsResult.data ?? []) as Question[];
  const subjects = (subjectsResult.data ?? []) as SubjectRecord[];
  const groups = (groupsResult.data ?? []) as GroupRecord[];
  const exams = (examsResult.data ?? []) as ExamRecord[];
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const examMap = new Map(exams.map((exam) => [exam.id, exam]));
  const subjectOptions = subjects
    .map((subject) => {
      const group = groupMap.get(subject.exam_group_id);
      const exam = group ? examMap.get(group.exam_id) : undefined;
      return { id: subject.id, groupOrder: group?.display_order ?? 999, subjectOrder: subject.display_order, label: `${exam?.name ?? "Unknown exam"} — ${group?.name ?? "Unknown entry"} — ${subject.name}` };
    })
    .sort((first, second) => first.groupOrder - second.groupOrder || first.subjectOrder - second.subjectOrder || first.label.localeCompare(second.label))
    .map(({ id, label }) => ({ id, label }));
  const activeQuestions = questions.filter((question) => question.is_active).length;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Content library</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Question bank</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Write reusable questions once, keep them organised by exam and subject, then assign them to any mock test.</p>
        </div>
        <a href="#add-question" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800">+ Add question</a>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          ["Total questions", questions.length, "In your library"],
          ["Active and ready", activeQuestions, "Available to assign"],
          ["Subjects", subjects.length, "Places to organise content"],
        ].map(([label, value, description]) => <div key={label as string} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p><p className="mt-2 text-xs font-medium text-slate-500">{description}</p></div>)}
      </section>

      <CreateQuestionForm subjects={subjectOptions} />

      {questionsResult.error && (
        <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5"><p className="font-bold text-red-800">Unable to load questions</p><p className="mt-1 text-sm text-red-700">{questionsResult.error.message}</p></div>
      )}

      {!questionsResult.error && questions.length === 0 && (
        <section className="mt-8 rounded-2xl border border-dashed bg-white p-10 text-center"><h2 className="text-xl font-black text-slate-950">Your question bank is empty</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Use the form above to add your first question. It will be available when you build a mock test.</p></section>
      )}

      {!questionsResult.error && questions.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-2xl font-black text-slate-950">Existing questions</h2><p className="mt-1 text-sm text-slate-600">Edit a question at any time. Remove is available for questions not assigned to a mock test.</p></div>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{questions.length} total</span>
          </div>
          <div className="mt-5 overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="min-w-[900px] w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                <tr><th className="px-5 py-4">Location</th><th className="px-5 py-4">Question</th><th className="px-5 py-4">Answer</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Manage</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((question) => {
                  const subject = question.subject_id ? subjectMap.get(question.subject_id) : undefined;
                  const group = subject ? groupMap.get(subject.exam_group_id) : undefined;
                  const exam = group ? examMap.get(group.exam_id) : undefined;
                  return (
                    <tr key={question.id} className="align-top transition hover:bg-slate-50/80">
                      <td className="px-5 py-5 text-sm"><p className="font-bold text-slate-800">{group?.name ?? "General"}</p><p className="mt-1 text-xs text-slate-500">{exam?.name ?? "Unknown exam"} · {subject?.name ?? "General"}</p></td>
                      <td className="max-w-xl px-5 py-5"><p className="line-clamp-2 font-semibold leading-6 text-slate-900">{question.question_text}</p><p className="mt-2 text-xs text-slate-500">Four-option MCQ</p></td>
                      <td className="px-5 py-5"><span className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-sm font-black text-teal-800">Option {question.correct_answer}</span></td>
                      <td className="px-5 py-5"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${question.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>{question.is_active ? "Active" : "Inactive"}</span></td>
                      <td className="px-5 py-5"><div className="flex items-center justify-end gap-2"><Link href={`/admin/questions/${question.id}/edit`} className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50">Edit</Link><DeleteQuestionButton questionId={question.id} questionText={question.question_text} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
