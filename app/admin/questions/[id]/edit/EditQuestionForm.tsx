"use client";

import { useActionState, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import type { Question, QuestionLifecycle } from "@/types/question";
import { updateQuestion, type UpdateQuestionState } from "./actions";

type SubjectOption = { id: string; label: string };

const initialState: UpdateQuestionState = { success: false, message: "" };

export function EditQuestionForm({
  question,
  subjects,
}: {
  question: Question;
  subjects: SubjectOption[];
}) {
  const [state, action, pending] = useActionState(
    updateQuestion.bind(null, question.id),
    initialState,
  );
  const [subjectId, setSubjectId] = useState(question.subject_id);
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer);
  const [lifecycle, setLifecycle] = useState<QuestionLifecycle>(
    question.content_lifecycle,
  );

  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
      <form action={action} className="space-y-5">
        <label className="block text-sm font-bold">
          Question classification
          <SearchableSelect
            name="subject_id"
            value={subjectId}
            onChange={setSubjectId}
            options={subjects.map((subject) => ({
              value: subject.id,
              label: subject.label,
            }))}
            placeholder="Search for a subject"
          />
        </label>
        <label className="block text-sm font-bold">
          Question
          <textarea
            name="question_text"
            required
            rows={4}
            defaultValue={question.question_text}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["A", question.option_a],
            ["B", question.option_b],
            ["C", question.option_c],
            ["D", question.option_d],
          ].map(([letter, value]) => (
            <label key={letter} className="block text-sm font-bold">
              Option {letter}
              <input
                name={`option_${letter.toLowerCase()}`}
                required
                defaultValue={value}
                className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
              />
            </label>
          ))}
        </div>
        <label className="block text-sm font-bold">
          Correct answer
          <SearchableSelect
            name="correct_answer"
            value={correctAnswer}
            onChange={(value) => setCorrectAnswer(value as Question["correct_answer"])}
            options={["A", "B", "C", "D"].map((answer) => ({
              value: answer,
              label: `Option ${answer}`,
            }))}
            placeholder="Search for the correct option"
          />
        </label>
        <label className="block text-sm font-bold">
          Question lifetime
          <SearchableSelect
            name="content_lifecycle"
            value={lifecycle}
            onChange={(value) => setLifecycle(value as QuestionLifecycle)}
            options={[
              { value: "permanent", label: "Permanent" },
              { value: "review", label: "Review later" },
              { value: "expires", label: "Expire after a date" },
            ]}
            placeholder="Search a lifetime setting"
          />
        </label>
        {lifecycle === "review" && (
          <label className="block text-sm font-bold">
            Review on
            <input
              name="review_on"
              required
              type="date"
              defaultValue={question.review_on ?? ""}
              className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
            />
          </label>
        )}
        {lifecycle === "expires" && (
          <label className="block text-sm font-bold">
            Stop using after
            <input
              name="expires_on"
              required
              type="date"
              defaultValue={question.expires_on ?? ""}
              className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
            />
          </label>
        )}
        <label className="block text-sm font-bold">
          Explanation
          <textarea
            name="explanation"
            rows={3}
            defaultValue={question.explanation ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-bold">
          Source reference
          <input
            name="source_reference"
            defaultValue={question.source_reference ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={question.is_active}
            className="h-4 w-4"
          />
          Ready to use in mock tests
        </label>
        <button
          disabled={pending}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Question"}
        </button>
        {state.message && (
          <p
            className={`text-sm font-semibold ${state.success ? "text-emerald-700" : "text-red-700"}`}
          >
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
