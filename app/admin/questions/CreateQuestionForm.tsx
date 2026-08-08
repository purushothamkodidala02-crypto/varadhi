"use client";

import { useActionState, useState } from "react";
import { createQuestion, type CreateQuestionState } from "./actions";
import type { QuestionLifecycle } from "@/types/question";

type SubjectOption = { id: string; label: string };
type GroupOption = { id: string; label: string };
type CreateQuestionFormProps = { subjects: SubjectOption[]; groups: GroupOption[] };

const initialState: CreateQuestionState = { success: false, message: "" };

export function CreateQuestionForm({ subjects, groups }: CreateQuestionFormProps) {
  const [state, formAction, pending] = useActionState(createQuestion, initialState);
  const [lifecycle, setLifecycle] = useState<QuestionLifecycle>("permanent");
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

              <label htmlFor="content_lifecycle" className="mt-6 block text-sm font-bold text-slate-800">Question lifetime</label>
              <select id="content_lifecycle" name="content_lifecycle" value={lifecycle} onChange={(event) => setLifecycle(event.target.value as QuestionLifecycle)} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm">
                <option value="permanent">Permanent — keep in the library</option>
                <option value="review">Review later — verify it on a chosen date</option>
                <option value="expires">Expiring — stop using it in new mocks after a date</option>
              </select>
              {lifecycle === "review" && <label htmlFor="review_on" className="mt-4 block text-sm font-bold text-slate-800">Review on<input id="review_on" name="review_on" type="date" required className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>}
              {lifecycle === "expires" && <label htmlFor="expires_on" className="mt-4 block text-sm font-bold text-slate-800">Stop using after<input id="expires_on" name="expires_on" type="date" required className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Expired questions stay in your records, but cannot be added to new mock tests.</span></label>}

              <fieldset className="mt-6">
                <legend className="text-sm font-bold text-slate-800">Also suitable for</legend>
                <p className="mt-1 text-xs leading-5 text-slate-500">Select other TGPSC exam entries that may reuse this question. The entry from the chosen subject is included automatically.</p>
                <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                  {groups.map((group) => <label key={group.id} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700"><input name="exam_group_ids" type="checkbox" value={group.id} className="mt-1 h-4 w-4 accent-teal-700" /><span>{group.label}</span></label>)}
                </div>
              </fieldset>
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
