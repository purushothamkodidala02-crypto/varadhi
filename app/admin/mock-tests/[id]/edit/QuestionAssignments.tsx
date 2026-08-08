"use client";

import { useActionState, useState } from "react";
import { assignQuestion, removeAssignedQuestion, type AssignmentState } from "./question-actions";

type QuestionOption = { id: string; text: string };
type AssignedQuestion = {
  id: string;
  question_order: number;
  marks: number;
  negative_marks: number;
  question_text: string;
};

type QuestionAssignmentsProps = {
  mockTestId: string;
  isDraft: boolean;
  availableQuestions: QuestionOption[];
  assignedQuestions: AssignedQuestion[];
};

const initialState: AssignmentState = { success: false, message: "" };

function RemoveAssignmentButton({ mockTestId, assignmentId }: { mockTestId: string; assignmentId: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function removeAssignment() {
    if (!window.confirm("Remove this Question from the Mock Test?")) return;
    setPending(true);
    setMessage("");
    const result = await removeAssignedQuestion(mockTestId, assignmentId);
    if (!result.success) {
      setMessage(result.message);
      setPending(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div>
      <button type="button" onClick={removeAssignment} disabled={pending} className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50">
        {pending ? "Removing..." : "Remove"}
      </button>
      {message && <p className="mt-1 max-w-xs text-xs text-red-600">{message}</p>}
    </div>
  );
}

export function QuestionAssignments({ mockTestId, isDraft, availableQuestions, assignedQuestions }: QuestionAssignmentsProps) {
  const assignQuestionWithTestId = assignQuestion.bind(null, mockTestId);
  const [state, formAction, pending] = useActionState(assignQuestionWithTestId, initialState);
  const nextOrder = assignedQuestions.length + 1;

  return (
    <section className="mt-8 rounded-xl border p-6">
      <div>
        <h2 className="text-xl font-semibold">Questions in this Mock Test</h2>
        <p className="mt-2 text-sm text-gray-600">Answers and explanations remain private; students never receive them during an active test.</p>
      </div>

      {isDraft ? (
        <form action={formAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="question_id" className="mb-2 block text-sm font-medium">Question Bank</label>
            <select id="question_id" name="question_id" required disabled={availableQuestions.length === 0} className="w-full rounded-lg border px-4 py-3 disabled:bg-gray-100">
              <option value="">Select a Question</option>
              {availableQuestions.map((question) => <option key={question.id} value={question.id}>{question.text}</option>)}
            </select>
            {availableQuestions.length === 0 && <p className="mt-2 text-sm text-amber-700">No other active Questions are available for this Mock Test's Subject.</p>}
          </div>

          <div>
            <label htmlFor="question_order" className="mb-2 block text-sm font-medium">Question order</label>
            <input id="question_order" name="question_order" type="number" min="1" step="1" required defaultValue={nextOrder} className="w-full rounded-lg border px-4 py-3" />
          </div>
          <div>
            <label htmlFor="marks" className="mb-2 block text-sm font-medium">Marks</label>
            <input id="marks" name="marks" type="number" min="0.01" step="0.01" required defaultValue="1" className="w-full rounded-lg border px-4 py-3" />
          </div>
          <div>
            <label htmlFor="negative_marks" className="mb-2 block text-sm font-medium">Negative marks</label>
            <input id="negative_marks" name="negative_marks" type="number" min="0" step="0.01" required defaultValue="0" className="w-full rounded-lg border px-4 py-3" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={pending || availableQuestions.length === 0} className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50">{pending ? "Adding..." : "Add Question"}</button>
          </div>
          {state.message && <p aria-live="polite" className={`md:col-span-2 text-sm ${state.success ? "text-green-700" : "text-red-600"}`}>{state.message}</p>}
        </form>
      ) : <p className="mt-6 rounded-lg bg-gray-100 p-4 text-sm text-gray-700">Published and archived Mock Tests are locked. Create a new draft version to change Questions.</p>}

      {assignedQuestions.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed p-5 text-sm text-gray-600">No Questions assigned yet. This Mock Test cannot be published until at least one Question is added.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border">
          <table className="w-full text-left">
            <thead className="border-b bg-gray-50"><tr><th className="px-4 py-3 text-sm">Order</th><th className="px-4 py-3 text-sm">Question</th><th className="px-4 py-3 text-sm">Marks</th><th className="px-4 py-3 text-sm">Negative</th>{isDraft && <th className="px-4 py-3 text-sm">Action</th>}</tr></thead>
            <tbody>{assignedQuestions.map((assignment) => <tr key={assignment.id} className="border-b last:border-b-0"><td className="px-4 py-3">{assignment.question_order}</td><td className="max-w-xl px-4 py-3 text-sm">{assignment.question_text}</td><td className="px-4 py-3 text-sm">{assignment.marks}</td><td className="px-4 py-3 text-sm">{assignment.negative_marks}</td>{isDraft && <td className="px-4 py-3"><RemoveAssignmentButton mockTestId={mockTestId} assignmentId={assignment.id} /></td>}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
