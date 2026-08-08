"use client";

import { useActionState } from "react";
import {
  createGroup,
  type CreateGroupState,
} from "./actions";

type ExamOption = {
  id: string;
  name: string;
};

type CreateGroupFormProps = {
  exams: ExamOption[];
};

const initialState: CreateGroupState = {
  success: false,
  message: "",
};

export function CreateGroupForm({
  exams,
}: CreateGroupFormProps) {
  const [state, formAction, pending] = useActionState(
    createGroup,
    initialState
  );

  return (
    <section className="mt-8 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">
        Add Exam
      </h2>

      <form action={formAction} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="exam_id"
            className="mb-2 block text-sm font-medium"
          >
            Exam category
          </label>

          <select
            id="exam_id"
            name="exam_id"
            required
            defaultValue={exams[0]?.id}
            className="w-full rounded-lg border px-4 py-3"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="exam_type"
            className="mb-2 block text-sm font-medium"
          >
            Exam Type
          </label>

          <select
            id="exam_type"
            name="exam_type"
            required
            defaultValue="group"
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="group">Group Exam</option>
            <option value="gazetted">Gazetted Exam</option>
            <option value="non_gazetted">
              Non-Gazetted Exam
            </option>
            <option value="other">Other Exam</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium"
          >
            Exam name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue="Group I"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="mb-2 block text-sm font-medium"
          >
            Slug
          </label>

          <input
            id="slug"
            name="slug"
            type="text"
            required
            pattern="[a-z0-9-]+"
            defaultValue="group-i"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue="TGPSC Group I mock tests"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="display_order"
            className="mb-2 block text-sm font-medium"
          >
            Display order
          </label>

          <input
            id="display_order"
            name="display_order"
            type="number"
            min="0"
            step="1"
            required
            defaultValue="1"
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
          disabled={pending || exams.length === 0}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add Exam"}
        </button>

        {state.message && (
          <p
            aria-live="polite"
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
