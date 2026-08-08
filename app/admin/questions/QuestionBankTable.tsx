"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeleteQuestionButton } from "./DeleteQuestionButton";
import type { QuestionLifecycle } from "@/types/question";

export type QuestionBankRow = {
  id: string;
  questionText: string;
  correctAnswer: string;
  isActive: boolean;
  contentLifecycle: QuestionLifecycle;
  reviewOn: string | null;
  expiresOn: string | null;
  examName: string;
  groupName: string;
  subjectName: string;
  subjectKey: string;
  suitableGroupLabels: string[];
};

type QuestionBankTableProps = { questions: QuestionBankRow[] };

function getQuestionStatus(question: QuestionBankRow) {
  const today = new Date().toISOString().slice(0, 10);
  if (!question.isActive) return { key: "inactive", label: "Inactive", className: "bg-slate-200 text-slate-700" };
  if (question.expiresOn && question.expiresOn < today) return { key: "expired", label: "Expired", className: "bg-rose-100 text-rose-800" };
  if (question.contentLifecycle === "review" && question.reviewOn && question.reviewOn <= today) return { key: "review-due", label: "Review due", className: "bg-amber-100 text-amber-800" };
  if (question.contentLifecycle === "expires") return { key: "expires", label: `Expires ${question.expiresOn}`, className: "bg-violet-100 text-violet-800" };
  if (question.contentLifecycle === "review") return { key: "review", label: `Review ${question.reviewOn}`, className: "bg-sky-100 text-sky-800" };
  return { key: "permanent", label: "Permanent", className: "bg-emerald-100 text-emerald-800" };
}

export function QuestionBankTable({ questions }: QuestionBankTableProps) {
  const [search, setSearch] = useState("");
  const [subjectKey, setSubjectKey] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const subjectOptions = useMemo(
    () => Array.from(new Map(questions.map((question) => [question.subjectKey, `${question.examName} — ${question.groupName} — ${question.subjectName}`])).entries()),
    [questions]
  );
  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return questions.filter((question) => {
      const status = getQuestionStatus(question);
      const matchesSubject = subjectKey === "all" || question.subjectKey === subjectKey;
      const matchesStatus = statusFilter === "all" || status.key === statusFilter || question.contentLifecycle === statusFilter;
      const matchesSearch = !query || `${question.questionText} ${question.groupName} ${question.subjectName} ${question.suitableGroupLabels.join(" ")}`.toLowerCase().includes(query);
      return matchesSubject && matchesStatus && matchesSearch;
    });
  }, [questions, search, subjectKey, statusFilter]);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl font-black text-slate-950">Existing questions</h2><p className="mt-1 text-sm text-slate-600">One question can serve several TGPSC Exams. Expired questions stay here safely but cannot be added to new mock tests.</p></div>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{filteredQuestions.length} of {questions.length}</span>
      </div>

      <div className="mt-5 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem_14rem]">
          <label className="text-sm font-bold text-slate-800">Search questions<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type part of a question…" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
          <label className="text-sm font-bold text-slate-800">Filter by subject<select value={subjectKey} onChange={(event) => setSubjectKey(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"><option value="all">All subjects</option>{subjectOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="text-sm font-bold text-slate-800">Library status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"><option value="all">All questions</option><option value="permanent">Permanent</option><option value="review">Review later</option><option value="review-due">Review due</option><option value="expires">Expiring</option><option value="expired">Expired</option><option value="inactive">Inactive</option></select></label>
        </div>
      </div>

      {filteredQuestions.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-600">No questions match these filters. Try another search or status.</div> : <div className="mt-5 overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="min-w-[1050px] w-full text-left"><thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-5 py-4">Main subject</th><th className="px-5 py-4">Question</th><th className="px-5 py-4">Suitable for</th><th className="px-5 py-4">Library status</th><th className="px-5 py-4">Answer</th><th className="px-5 py-4 text-right">Manage</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredQuestions.map((question) => { const status = getQuestionStatus(question); return <tr key={question.id} className="align-top transition hover:bg-slate-50/80"><td className="px-5 py-5 text-sm"><p className="font-bold text-slate-800">{question.groupName}</p><p className="mt-1 text-xs text-slate-500">{question.examName} · {question.subjectName}</p></td><td className="max-w-xl px-5 py-5"><p className="line-clamp-2 font-semibold leading-6 text-slate-900">{question.questionText}</p><p className="mt-2 text-xs text-slate-500">Four-option MCQ</p></td><td className="max-w-52 px-5 py-5 text-xs leading-5 text-slate-600">{question.suitableGroupLabels.join(", ") || question.groupName}</td><td className="px-5 py-5"><span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${status.className}`}>{status.label}</span></td><td className="px-5 py-5"><span className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-sm font-black text-teal-800">Option {question.correctAnswer}</span></td><td className="px-5 py-5"><div className="flex items-center justify-end gap-2"><Link href={`/admin/questions/${question.id}/edit`} className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50">Edit</Link><DeleteQuestionButton questionId={question.id} questionText={question.questionText} /></div></td></tr>; })}</tbody></table></div>}
    </section>
  );
}
