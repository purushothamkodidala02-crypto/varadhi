"use client";

import { useActionState } from "react";
import type { Question } from "@/types/question";
import { updateQuestion, type UpdateQuestionState } from "./actions";

type SubjectOption = { id: string; label: string };

type EditQuestionFormProps = {
  question: Question;
  subjects: SubjectOption[];
};

const initialState: UpdateQuestionState = { success: false, message: "" };

export function EditQuestionForm({ question, subjects }: EditQuestionFormProps) {
  const updateQuestionWithId = updateQuestion.bind(null, question.id);
  const [state, formAction, pending] = useActionState(
    updateQuestionWithId,
    initialState
  );

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

        <button type="submit" disabled={pending} className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Saving..." : "Save Changes"}
        </button>

        {state.message && <p aria-live="polite" className={state.success ? "text-sm text-green-700" : "text-sm text-red-600"}>{state.message}</p>}
      </form>
    </section>
  );
}
