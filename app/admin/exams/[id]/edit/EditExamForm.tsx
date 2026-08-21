"use client";

import { useActionState } from "react";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";
import type { Exam } from "@/types/exam";
import {
  updateExam,
  type UpdateExamState,
} from "./actions";

type EditExamFormProps = {
  exam: Exam;
  states: Array<{ id: string; name: string; code: string }>;
};

const initialState: UpdateExamState = {
  success: false,
  message: "",
};

export function EditExamForm({
  exam,
  states,
}: EditExamFormProps) {
  const updateExamWithId = updateExam.bind(null, exam.id);

  const [state, formAction, pending] = useActionState(
    updateExamWithId,
    initialState
  );

  return (
    <section className="mt-8 rounded-xl border p-6">
      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="state_id" className="mb-2 block text-sm font-medium">State / catalogue</label>
          <select id="state_id" name="state_id" required defaultValue={exam.state_id} className="w-full rounded-lg border bg-white px-4 py-3">
            {states.map((state) => <option key={state.id} value={state.id}>{state.code} · {state.name}</option>)}
          </select>
        </div>
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium"
          >
            Exam category name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={exam.name}
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
            defaultValue={exam.slug}
            className="w-full rounded-lg border px-4 py-3"
          />

          <p className="mt-1 text-xs text-gray-500">
            Use lowercase letters, numbers and hyphens only.
          </p>
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
            rows={4}
            defaultValue={exam.description ?? ""}
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
            defaultValue={exam.display_order}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <label className="flex items-center gap-3">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={exam.is_active}
            className="h-4 w-4"
          />

          <span className="text-sm font-medium">
            Active
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PendingButtonContent pending={pending} pendingLabel="Saving changes…">Save Changes</PendingButtonContent>
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
