"use client";

import { useActionState, useState } from "react";
import type { Question, QuestionLifecycle } from "@/types/question";
import { updateQuestion, type UpdateQuestionState } from "./actions";

type SubjectOption = { id: string; label: string };
type GroupOption = { id: string; label: string };

type EditQuestionFormProps = {
  question: Question;
  subjects: SubjectOption[];
  groups: GroupOption[];
  selectedGroupIds: string[];
};

const initialState: UpdateQuestionState = { success: false, message: "" };

export function EditQuestionForm({ question, subjects, groups, selectedGroupIds }: EditQuestionFormProps) {
  const updateQuestionWithId = updateQuestion.bind(null, question.id);
  const [state, formAction, pending] = useActionState(
    updateQuestionWithId,
    initialState
  );
  const [lifecycle, setLifecycle] = useState<QuestionLifecycle>(question.content_lifecycle ?? "permanent");

  return (
    <section className="mt-8 rounded-xl border p-6">
      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="subject_id" className="mb-2 block text-sm font-medium">
            Subject
          </label>
          <select id="subject_id" name="subject_id" required defaultValue={question.subject_id ?? ""} className="w-full rounded-lg border px-4 py-3">
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="question_text" className="mb-2 block text-sm font-medium">Question</label>
          <textarea id="question_text" name="question_text" rows={4} required defaultValue={question.question_text} className="w-full rounded-lg border px-4 py-3" />
        </div>

        {(["a", "b", "c", "d"] as const).map((option) => {
          const field = `option_${option}` as const;
          const value = question[field];
          return (
            <div key={field}>
              <label htmlFor={field} className="mb-2 block text-sm font-medium">Option {option.toUpperCase()}</label>
              <input id={field} name={field} required defaultValue={value} className="w-full rounded-lg border px-4 py-3" />
            </div>
          );
        })}

        <div>
          <label htmlFor="correct_answer" className="mb-2 block text-sm font-medium">Correct answer</label>
          <select id="correct_answer" name="correct_answer" required defaultValue={question.correct_answer} className="w-full rounded-lg border px-4 py-3">
            <option value="A">Option A</option><option value="B">Option B</option><option value="C">Option C</option><option value="D">Option D</option>
          </select>
        </div>

        <div>
          <label htmlFor="explanation" className="mb-2 block text-sm font-medium">Explanation</label>
          <textarea id="explanation" name="explanation" rows={3} defaultValue={question.explanation ?? ""} className="w-full rounded-lg border px-4 py-3" />
        </div>

        <div>
          <label htmlFor="source_reference" className="mb-2 block text-sm font-medium">Source reference</label>
          <input id="source_reference" name="source_reference" defaultValue={question.source_reference ?? ""} className="w-full rounded-lg border px-4 py-3" />
        </div>

        <div>
          <label htmlFor="image_url" className="mb-2 block text-sm font-medium">Image URL (optional)</label>
          <input id="image_url" name="image_url" type="url" defaultValue={question.image_url ?? ""} className="w-full rounded-lg border px-4 py-3" />
        </div>

        <label className="flex items-center gap-3">
          <input name="is_active" type="checkbox" defaultChecked={question.is_active} className="h-4 w-4" />
          <span className="text-sm font-medium">Active</span>
        </label>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-900">Question lifetime</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">Use an expiry date for Current Affairs. Permanent subjects such as History can remain in the library.</p>
          <label htmlFor="content_lifecycle" className="mt-4 block text-sm font-medium">Lifetime</label>
          <select id="content_lifecycle" name="content_lifecycle" value={lifecycle} onChange={(event) => setLifecycle(event.target.value as QuestionLifecycle)} className="mt-2 w-full rounded-lg border px-4 py-3">
            <option value="permanent">Permanent</option>
            <option value="review">Review later</option>
            <option value="expires">Expiring</option>
          </select>
          {lifecycle === "review" && <label htmlFor="review_on" className="mt-4 block text-sm font-medium">Review on<input id="review_on" name="review_on" type="date" required defaultValue={question.review_on ?? ""} className="mt-2 w-full rounded-lg border px-4 py-3" /></label>}
          {lifecycle === "expires" && <label htmlFor="expires_on" className="mt-4 block text-sm font-medium">Stop using after<input id="expires_on" name="expires_on" type="date" required defaultValue={question.expires_on ?? ""} className="mt-2 w-full rounded-lg border px-4 py-3" /></label>}
        </section>

        <fieldset className="rounded-xl border border-slate-200 p-5">
          <legend className="px-1 text-sm font-bold text-slate-900">Suitable for Exams</legend>
          <p className="mt-1 text-xs leading-5 text-slate-600">This lets one question appear in relevant Group 1, Group 2, EO, or other TGPSC mocks without making duplicate questions.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {groups.map((group) => <label key={group.id} className="flex items-start gap-2 text-sm"><input name="exam_group_ids" type="checkbox" value={group.id} defaultChecked={selectedGroupIds.includes(group.id)} className="mt-1 h-4 w-4 accent-teal-700" /><span>{group.label}</span></label>)}
          </div>
        </fieldset>

        <button type="submit" disabled={pending} className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Saving..." : "Save Changes"}
        </button>

        {state.message && <p aria-live="polite" className={state.success ? "text-sm text-green-700" : "text-sm text-red-600"}>{state.message}</p>}
      </form>
    </section>
  );
}
