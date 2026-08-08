"use client";

import { useActionState } from "react";
import { createQuestion, type CreateQuestionState } from "./actions";

type SubjectOption = { id: string; label: string };
type CreateQuestionFormProps = { subjects: SubjectOption[] };

const initialState: CreateQuestionState = { success: false, message: "" };

export function CreateQuestionForm({ subjects }: CreateQuestionFormProps) {
  const [state, formAction, pending] = useActionState(createQuestion, initialState);
  const hasSubjects = subjects.length > 0;

  return (
    <section id="add-question" className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">New question</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Add a question to your library</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Choose a subject first. The question can then be reused in one or more mock tests.</p>
      </div>

      {!hasSubjects ? (
        <div className="p-7">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Add a subject before creating questions. Subjects keep every question organised under the right exam entry.</p>
        </div>
      ) : (
        <form action={formAction} className="p-6 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">1. Choose where it belongs</p>
              <label htmlFor="subject_id" className="mt-4 block text-sm font-bold text-slate-800">Subject</label>
              <select id="subject_id" name="subject_id" required defaultValue="" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm">
                <option value="" disabled>Select exam entry and subject</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}
              </select>
              <p className="mt-3 text-xs leading-5 text-slate-500">The full exam path is shown so this question is added to the correct place.</p>

              <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 accent-teal-700" />
                <span><span className="block text-sm font-bold text-slate-800">Ready to use</span><span className="block text-xs text-slate-500">Active questions can be assigned to mock tests.</span></span>
              </label>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">2. Write the question</p>
              <label htmlFor="question_text" className="mt-4 block text-sm font-bold text-slate-800">Question text</label>
              <textarea id="question_text" name="question_text" rows={4} required placeholder="Write a clear, single-answer question…" className="mt-2 w-full rounded-xl border px-4 py-3 leading-6" />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["A", "option_a"],
                  ["B", "option_b"],
                  ["C", "option_c"],
                  ["D", "option_d"],
                ].map(([letter, name]) => (
                  <label key={name} className="block text-sm font-bold text-slate-800">
                    Option {letter}
                    <input name={name} required placeholder={`Answer choice ${letter}`} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
                  </label>
                ))}
              </div>

              <label htmlFor="correct_answer" className="mt-5 block text-sm font-bold text-slate-800">Correct answer</label>
              <select id="correct_answer" name="correct_answer" required defaultValue="" className="mt-2 w-full rounded-xl border px-4 py-3">
                <option value="" disabled>Choose the correct option</option>
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </section>
          </div>

          <details className="mt-6 rounded-2xl border border-slate-200 p-5">
            <summary className="cursor-pointer text-sm font-bold text-slate-800">Add explanation, source, or image (optional)</summary>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label htmlFor="explanation" className="block text-sm font-bold text-slate-800 md:col-span-2">Explanation<textarea id="explanation" name="explanation" rows={3} placeholder="Explain why the selected option is correct…" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal leading-6" /></label>
              <label htmlFor="source_reference" className="block text-sm font-bold text-slate-800">Source reference<input id="source_reference" name="source_reference" placeholder="Book, Act, website, etc." className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
              <label htmlFor="image_url" className="block text-sm font-bold text-slate-800">Image URL<input id="image_url" name="image_url" type="url" placeholder="https://…" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
            </div>
          </details>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="submit" disabled={pending} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              {pending ? "Saving question…" : "Save question"}
            </button>
            <p className="text-sm text-slate-500">You can edit it later or assign it to a mock test.</p>
          </div>

          {state.message && <p aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{state.message}</p>}
        </form>
      )}
    </section>
  );
}
