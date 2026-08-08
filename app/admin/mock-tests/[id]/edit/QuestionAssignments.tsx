"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { assignQuestion, removeAssignedQuestion, type AssignmentState } from "./question-actions";

type QuestionOption = { id: string; text: string };
type AssignedQuestion = { id: string; question_order: number; marks: number; negative_marks: number; question_text: string };
type QuestionAssignmentsProps = { mockTestId: string; isDraft: boolean; availableQuestions: QuestionOption[]; assignedQuestions: AssignedQuestion[] };
const initialState: AssignmentState = { success: false, message: "" };

function RemoveAssignmentButton({ mockTestId, assignmentId }: { mockTestId: string; assignmentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function removeAssignment() {
    if (!window.confirm("Remove this question from this draft mock test? The original question will remain safely in the question bank.")) return;
    setPending(true);
    setMessage("");
    const result = await removeAssignedQuestion(mockTestId, assignmentId);
    if (!result.success) { setMessage(result.message); setPending(false); return; }
    router.refresh();
  }
  return <div className="flex flex-col items-end"><button type="button" onClick={removeAssignment} disabled={pending} className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">{pending ? "Removing…" : "Remove"}</button>{message && <p className="mt-1 max-w-48 text-right text-xs leading-5 text-red-700">{message}</p>}</div>;
}

export function QuestionAssignments({ mockTestId, isDraft, availableQuestions, assignedQuestions }: QuestionAssignmentsProps) {
  const assignQuestionWithTestId = assignQuestion.bind(null, mockTestId);
  const [state, formAction, pending] = useActionState(assignQuestionWithTestId, initialState);
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const nextOrder = assignedQuestions.length + 1;
  const matchingQuestions = useMemo(() => {
    const query = questionSearch.trim().toLowerCase();
    return availableQuestions.filter((question) => !query || question.text.toLowerCase().includes(query)).slice(0, 100);
  }, [availableQuestions, questionSearch]);
  const selectedQuestion = availableQuestions.find((question) => question.id === selectedQuestionId);

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5 sm:px-7"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Test builder</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Questions in this mock test</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Search active, in-date questions that are suitable for this exam entry. Reuse one library question across relevant TGPSC tests without copying it.</p></div><span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">{assignedQuestions.length} assigned</span></div>

      {isDraft ? <form action={formAction} className="border-b border-slate-100 p-6 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-black text-slate-950">Add a question</p><p className="mt-1 text-sm text-slate-600">Only unassigned questions suitable for this mock test are shown. Expired Current Affairs questions are hidden.</p></div><Link href="/admin/questions#add-question" className="text-sm font-bold text-teal-700 hover:text-teal-800">+ Create a new question</Link></div>
        <div className="mt-5 grid gap-4 md:grid-cols-6"><label className="block text-sm font-bold text-slate-800 md:col-span-6">Search the question bank<input type="search" value={questionSearch} onChange={(event) => { setQuestionSearch(event.target.value); setSelectedQuestionId(""); }} placeholder="Type a word from the question…" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label><label htmlFor="question_id" className="block text-sm font-bold text-slate-800 md:col-span-6">Choose question<select id="question_id" name="question_id" required value={selectedQuestionId} onChange={(event) => setSelectedQuestionId(event.target.value)} disabled={availableQuestions.length === 0} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:bg-slate-100"><option value="" disabled>{matchingQuestions.length === 0 ? "No matching questions" : `Select from ${matchingQuestions.length} matching questions`}</option>{matchingQuestions.map((question) => <option key={question.id} value={question.id}>{question.text}</option>)}</select></label>{selectedQuestion && <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900 md:col-span-6"><span className="font-black">Selected question:</span> {selectedQuestion.text}</p>}<label htmlFor="question_order" className="block text-sm font-bold text-slate-800 md:col-span-2">Order<input id="question_order" name="question_order" type="number" min="1" step="1" required defaultValue={nextOrder} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label><label htmlFor="marks" className="block text-sm font-bold text-slate-800 md:col-span-2">Marks<input id="marks" name="marks" type="number" min="0.01" step="0.01" required defaultValue="1" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label><label htmlFor="negative_marks" className="block text-sm font-bold text-slate-800 md:col-span-2">Negative marks<input id="negative_marks" name="negative_marks" type="number" min="0" step="0.01" required defaultValue="0" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label></div>
        {availableQuestions.length === 0 && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">There are no unassigned active questions for this subject. Create one in the question bank, or change this mock test’s subject.</p>}{availableQuestions.length > 0 && matchingQuestions.length === 0 && <p className="mt-4 text-sm text-slate-600">No questions match that search. Clear the search or use a different keyword.</p>}<div className="mt-5 flex flex-wrap items-center gap-4"><button type="submit" disabled={pending || !selectedQuestionId} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Adding question…" : "Add to mock test"}</button><p className="text-sm text-slate-500">Draft tests can be changed until you publish them.</p></div>{state.message && <p aria-live="polite" className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{state.message}</p>}</form> : <div className="m-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">This mock test is published or archived, so its questions are locked to protect past and current student attempts. Restore it as a draft to make changes.</div>}
      {assignedQuestions.length === 0 ? <div className="p-7"><p className="rounded-2xl border border-dashed bg-slate-50 p-6 text-center text-sm leading-6 text-slate-600">No questions are assigned yet. Add at least one question before this mock test can be published.</p></div> : <div className="overflow-x-auto"><table className="min-w-[700px] w-full text-left"><thead className="border-y border-slate-100 bg-white text-xs font-bold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-6 py-4">Order</th><th className="px-6 py-4">Question</th><th className="px-6 py-4">Scoring</th>{isDraft && <th className="px-6 py-4 text-right">Manage</th>}</tr></thead><tbody className="divide-y divide-slate-100">{assignedQuestions.map((assignment) => <tr key={assignment.id} className="align-top hover:bg-slate-50"><td className="px-6 py-5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-sm font-black text-slate-700">{assignment.question_order}</span></td><td className="max-w-xl px-6 py-5 text-sm font-semibold leading-6 text-slate-900">{assignment.question_text}</td><td className="px-6 py-5 text-sm"><p className="font-bold text-slate-800">{assignment.marks} mark{assignment.marks === 1 ? "" : "s"}</p><p className="mt-1 text-xs text-slate-500">−{assignment.negative_marks} negative</p></td>{isDraft && <td className="px-6 py-5"><RemoveAssignmentButton mockTestId={mockTestId} assignmentId={assignment.id} /></td>}</tr>)}</tbody></table></div>}
    </section>
  );
}
