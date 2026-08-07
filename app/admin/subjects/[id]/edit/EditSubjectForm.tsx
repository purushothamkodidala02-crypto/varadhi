"use client";

import { useActionState } from "react";
import type { Subject } from "@/types/subject";
import {
  updateSubject,
  type UpdateSubjectState,
} from "./actions";

type GroupOption = {
  id: string;
  label: string;
};

type EditSubjectFormProps = {
  subject: Subject;
  groups: GroupOption[];
};

const initialState: UpdateSubjectState = {
  success: false,
  message: "",
};

export function EditSubjectForm({
  subject,
  groups,
}: EditSubjectFormProps) {
  const updateSubjectWithId = updateSubject.bind(
    null,
    subject.id
  );

  const [state, formAction, pending] = useActionState(
    updateSubjectWithId,
    initialState
  );

  return (
    <section className="mt-8 rounded-xl border p-6">
      <form action={formAction} className="space-y-5">
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
            defaultValue={subject.exam_group_id}
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
            defaultValue={subject.name}
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
            defaultValue={subject.slug}
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
            rows={4}
            defaultValue={subject.description ?? ""}
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
            defaultValue={subject.display_order}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <label className="flex items-center gap-3">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={subject.is_active}
            className="h-4 w-4"
          />

          <span className="text-sm font-medium">Active</span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
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