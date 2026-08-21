"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { FormattedQuestionText } from "@/components/questions/FormattedQuestionText";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";
import {
  assignQuestion,
  fillRemainingWithLatest,
  moveAssignedQuestion,
  removeAssignedQuestion,
  type AssignmentState,
} from "./question-actions";

type QuestionOption = { id: string; text: string };
type AssignedQuestion = {
  id: string;
  question_id: string;
  question_order: number;
  marks: number;
  negative_marks: number;
  question_text: string;
  is_active: boolean;
  is_score_valid: boolean;
};
type QuestionAssignmentsProps = {
  mockTestId: string;
  isDraft: boolean;
  targetQuestionCount: number;
  availableQuestions: QuestionOption[];
  assignedQuestions: AssignedQuestion[];
  defaultMarks: number;
  defaultNegativeMarks: number;
};

const initialState: AssignmentState = { success: false, message: "" };

function RemoveAssignmentButton({
  mockTestId,
  assignmentId,
}: {
  mockTestId: string;
  assignmentId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function removeAssignment() {
    if (!window.confirm("Remove this question from this draft mock test? The original question stays in the question bank.")) {
      return;
    }

    setPending(true);
    const result = await removeAssignedQuestion(mockTestId, assignmentId);
    if (!result.success) {
      setMessage(result.message);
      setPending(false);
      return;
    }

    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={removeAssignment}
        disabled={pending}
        aria-busy={pending}
        className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        <PendingButtonContent pending={pending} pendingLabel="Removing…">Remove</PendingButtonContent>
      </button>
      {message && (
        <p className="mt-1 max-w-48 text-right text-xs leading-5 text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}

function MoveButtons({ mockTestId, assignmentId, first, last }: { mockTestId: string; assignmentId: string; first: boolean; last: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function move(direction: -1 | 1) {
    setPending(true);
    const result = await moveAssignedQuestion(mockTestId, assignmentId, direction);
    if (!result.success) window.alert(result.message);
    setPending(false);
    router.refresh();
  }
  return <div className="mt-2 flex gap-1"><button type="button" title="Move up" disabled={pending || first} onClick={() => move(-1)} className="rounded border px-2 py-1 text-xs font-bold disabled:opacity-35">↑</button><button type="button" title="Move down" disabled={pending || last} onClick={() => move(1)} className="rounded border px-2 py-1 text-xs font-bold disabled:opacity-35">↓</button></div>;
}

function FillLatestButton({ mockTestId, disabled }: { mockTestId: string; disabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function fill() {
    if (!window.confirm("Keep the assigned Questions and fill only the remaining slots with the latest eligible Questions?")) return;
    setPending(true); setMessage("");
    const result = await fillRemainingWithLatest(mockTestId);
    setMessage(result.message); setPending(false);
    if (result.success) router.refresh();
  }
  return <div><button type="button" disabled={pending || disabled} onClick={fill} aria-busy={pending} className="rounded-xl border border-teal-700 bg-white px-4 py-2.5 text-sm font-bold text-teal-800 disabled:opacity-45"><PendingButtonContent pending={pending} pendingLabel="Filling slots…">Fill remaining with latest</PendingButtonContent></button>{message && <p aria-live="polite" className="mt-2 max-w-sm text-xs text-slate-600">{message}</p>}</div>;
}

export function QuestionAssignments({
  mockTestId,
  isDraft,
  targetQuestionCount,
  availableQuestions,
  assignedQuestions,
  defaultMarks,
  defaultNegativeMarks,
}: QuestionAssignmentsProps) {
  const assignQuestionWithTestId = assignQuestion.bind(null, mockTestId);
  const [state, formAction, pending] = useActionState(
    assignQuestionWithTestId,
    initialState,
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const selectedQuestion = availableQuestions.find(
    (question) => question.id === selectedQuestionId,
  );
  const readyQuestionCount = assignedQuestions.filter(
    (question) => question.is_active && question.is_score_valid,
  ).length;

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5 sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
            Test builder
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Questions in this mock test
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Use the Paper&apos;s scoring pattern as a guide, then enter the official
            score for this question.
          </p>
        </div>
        <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
          {assignedQuestions.length} of {targetQuestionCount} assigned · {readyQuestionCount} ready
        </span>
      </div>

      {isDraft ? (
        <form action={formAction} className="border-b border-slate-100 p-6 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-950">Add a question</p>
              <p className="mt-1 text-sm text-slate-600">
                Only active, unassigned questions from this mock test&apos;s Paper are shown.
              </p>
            </div>
            <Link
              href="/admin/questions#add-question"
              className="text-sm font-bold text-teal-700 hover:text-teal-800"
            >
              + Create a new question
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-6">
            <label className="block text-sm font-bold text-slate-800 md:col-span-6">
              Search the question bank
              <SearchableSelect
                name="question_id"
                value={selectedQuestionId}
                onChange={setSelectedQuestionId}
                options={availableQuestions.map((question) => ({
                  value: question.id,
                  label: question.text,
                }))}
                placeholder="Type words from a Question, then choose it"
                disabled={availableQuestions.length === 0}
                emptyMessage="No unassigned Question matches those words."
              />
              <span className="mt-2 block text-xs font-normal text-slate-500">Searches all {availableQuestions.length} active, unassigned Questions available for this Mock Test.</span>
            </label>
            {selectedQuestion && (
              <div className="rounded-xl bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900 md:col-span-6">
                <span className="font-black">Selected question:</span>
                <FormattedQuestionText text={selectedQuestion.text} className="mt-1" />
              </div>
            )}
            <label className="block text-sm font-bold text-slate-800 md:col-span-2">
              Order
              <input
                name="question_order"
                type="number"
                min="1"
                step="1"
                required
                placeholder={`For example: ${assignedQuestions.length + 1}`}
                className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
              />
            </label>
            <label className="block text-sm font-bold text-slate-800 md:col-span-2">
              Correct marks
              <input
                name="marks"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder={`For example: ${defaultMarks}`}
                className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
              />
            </label>
            <label className="block text-sm font-bold text-slate-800 md:col-span-2">
              Negative marks
              <input
                name="negative_marks"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder={`For example: ${defaultNegativeMarks}`}
                className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
              />
            </label>
          </div>

          {availableQuestions.length === 0 && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              There are no unassigned active questions for this Paper. Create one in the
              question bank first.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={pending || !selectedQuestionId || assignedQuestions.length >= targetQuestionCount}
              aria-busy={pending}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PendingButtonContent pending={pending} pendingLabel="Adding question…">Add to mock test</PendingButtonContent>
            </button>
            <p className="text-sm text-slate-500">
              {Math.max(targetQuestionCount - assignedQuestions.length, 0)} slot{targetQuestionCount - assignedQuestions.length === 1 ? "" : "s"} remaining.
            </p>
            <FillLatestButton mockTestId={mockTestId} disabled={assignedQuestions.length >= targetQuestionCount} />
          </div>
          {state.message && (
            <p
              aria-live="polite"
              className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}
            >
              {state.message}
            </p>
          )}
        </form>
      ) : (
        <div className="m-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          This mock test is published or archived, so its questions are locked.
        </div>
      )}

      {assignedQuestions.length === 0 ? (
        <div className="p-7">
          <p className="rounded-2xl border border-dashed bg-slate-50 p-6 text-center text-sm leading-6 text-slate-600">
            No questions are assigned yet. Add at least one question before this mock test
            can be published.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-left">
            <thead className="border-y border-slate-100 bg-white text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Question</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4">Scoring</th>
                {isDraft && <th className="px-6 py-4 text-right">Manage</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignedQuestions.map((assignment, index) => (
                <tr key={assignment.id} className="align-top hover:bg-slate-50">
                  <td className="px-6 py-5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-sm font-black text-slate-700">
                      {assignment.question_order}
                    </span>
                    {isDraft && <MoveButtons mockTestId={mockTestId} assignmentId={assignment.id} first={index === 0} last={index === assignedQuestions.length - 1} />}
                  </td>
                  <td className="max-w-xl px-6 py-5 text-sm font-semibold leading-6 text-slate-900">
                    <FormattedQuestionText text={assignment.question_text} />
                  </td>
                  <td className="px-6 py-5 text-sm">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${assignment.is_active && assignment.is_score_valid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                      {assignment.is_active && assignment.is_score_valid ? "Student ready" : assignment.is_active ? "Invalid scoring" : "Inactive"}
                    </span>
                    {!assignment.is_active && <p className="mt-2 max-w-40 text-xs leading-5 text-red-700">Activate this Question in the Question Bank before students can take the test.</p>}
                    {assignment.is_active && !assignment.is_score_valid && <p className="mt-2 max-w-40 text-xs leading-5 text-red-700">Correct marks must be greater than zero. Remove and add this Question again with valid scoring.</p>}
                  </td>
                  <td className="px-6 py-5 text-sm">
                    <p className="font-bold text-slate-800">
                      {assignment.marks} mark{assignment.marks === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      -{assignment.negative_marks} negative
                    </p>
                  </td>
                  {isDraft && (
                    <td className="px-6 py-5">
                      <Link href={`/admin/questions/${assignment.question_id}/edit?returnTo=${encodeURIComponent(`/admin/mock-tests/${mockTestId}/edit`)}`} className="mb-2 inline-block rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50">Edit / replace</Link>
                      <RemoveAssignmentButton
                        mockTestId={mockTestId}
                        assignmentId={assignment.id}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
