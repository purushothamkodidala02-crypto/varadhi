"use client";

import { useActionState } from "react";
import {
  createQuestion,
  type CreateQuestionState,
} from "./actions";

type SubjectOption = {
  id: string;
  label: string;
};

type CreateQuestionFormProps = {
  subjects: SubjectOption[];
};

const initialState: CreateQuestionState = {
  success: false,
  message: "",
};

export function CreateQuestionForm({
  subjects,
}: CreateQuestionFormProps) {
  const [state, formAction, pending] = useActionState(
    createQuestion,
    initialState
  );

  return (
    <section className="mt-8 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">
        Add Question
      </h2>

      <form action={formAction} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="subject_id"
            className="mb-2 block text-sm font-medium"
          >
            Subject
          </label>

          <select
            id="subject_id"
            name="subject_id"
            required
            defaultValue={subjects[0]?.id}
            className="w-full rounded-lg border px-4 py-3"
          >
            {subjects.map((subject) => (
              <option
                key={subject.id}
                value={subject.id}
              >
                {subject.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="question_text"
            className="mb-2 block text-sm font-medium"
          >
            Question
          </label>

          <textarea
            id="question_text"
            name="question_text"
            rows={4}
            required
            defaultValue="On which date was Telangana officially formed?"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="option_a"
            className="mb-2 block text-sm font-medium"
          >
            Option A
          </label>

          <input
            id="option_a"
            name="option_a"
            required
            defaultValue="2 June 2014"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="option_b"
            className="mb-2 block text-sm font-medium"
          >
            Option B
          </label>

          <input
            id="option_b"
            name="option_b"
            required
            defaultValue="1 June 2014"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="option_c"
            className="mb-2 block text-sm font-medium"
          >
            Option C
          </label>

          <input
            id="option_c"
            name="option_c"
            required
            defaultValue="2 June 2013"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="option_d"
            className="mb-2 block text-sm font-medium"
          >
            Option D
          </label>

          <input
            id="option_d"
            name="option_d"
            required
            defaultValue="1 July 2014"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="correct_answer"
            className="mb-2 block text-sm font-medium"
          >
            Correct answer
          </label>

          <select
            id="correct_answer"
            name="correct_answer"
            required
            defaultValue="A"
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="A">Option A</option>
            <option value="B">Option B</option>
            <option value="C">Option C</option>
            <option value="D">Option D</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="explanation"
            className="mb-2 block text-sm font-medium"
          >
            Explanation
          </label>

          <textarea
            id="explanation"
            name="explanation"
            rows={3}
            defaultValue="Telangana officially became the 29th state of India on 2 June 2014."
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="source_reference"
            className="mb-2 block text-sm font-medium"
          >
            Source reference
          </label>

          <input
            id="source_reference"
            name="source_reference"
            defaultValue="Andhra Pradesh Reorganisation Act, 2014"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="image_url"
            className="mb-2 block text-sm font-medium"
          >
            Image URL (optional)
          </label>

          <input
            id="image_url"
            name="image_url"
            type="url"
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <label className="flex items-center gap-3">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked
            className="h-4 w-4"
          />

          <span className="text-sm font-medium">Active</span>
        </label>

        <button
          type="submit"
          disabled={pending || subjects.length === 0}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add Question"}
        </button>

        {state.message && (
          <p
            className={
              state.success
                ? "text-sm text-green-700"
                : "text-sm text-red-600"
            }
          >
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}