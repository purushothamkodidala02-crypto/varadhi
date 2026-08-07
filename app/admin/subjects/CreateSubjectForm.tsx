"use client";

import { useActionState } from "react";
import {
  createSubject,
  type CreateSubjectState,
} from "./actions";

type GroupOption = {
  id: string;
  label: string;
};

type CreateSubjectFormProps = {
  groups: GroupOption[];
};

const initialState: CreateSubjectState = {
  success: false,
  message: "",
};

export function CreateSubjectForm({
  groups,
}: CreateSubjectFormProps) {
  const [state, formAction, pending] = useActionState(
    createSubject,
    initialState
  );

  return (
    <section className="mt-8 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">Add Subject</h2>

      <form action={formAction} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="exam_group_id"
            className="mb-2 block text-sm font-medium"
          >
            Exam Group
          </label>

          <select
            id="exam_group_id"
            name="exam_group_id"
            required
            defaultValue={groups[0]?.id}
            className="w-full rounded-lg border px-4 py-3"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium"
          >
            Subject name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue="Current Affairs"
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
            defaultValue="current-affairs"
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
            defaultValue="Regional, National and International Current Affairs"
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
          disabled={pending || groups.length === 0}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add Subject"}
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