"use client";

import { useActionState } from "react";
import {
  createExam,
  type CreateExamState,
} from "./actions";

const initialState: CreateExamState = {
  success: false,
  message: "",
};

export function CreateExamForm() {
  const [state, formAction, pending] = useActionState(
    createExam,
    initialState
  );

  return (
    <section className="mt-8 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">Add Exam Category</h2>

      <form action={formAction} className="mt-6 space-y-5">
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
            placeholder="For example: TGPSC"
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
            placeholder="For example: tgpsc"
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
            rows={3}
            placeholder="For example: Telangana Public Service Commission mock tests"
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
            placeholder="For example: 1"
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
          disabled={pending}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add Exam Category"}
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
