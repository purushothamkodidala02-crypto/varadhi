"use client";

import { useActionState } from "react";
import type { ExamGroup } from "@/types/group";
import {
  updateGroup,
  type UpdateGroupState,
} from "./actions";

type ExamOption = {
  id: string;
  name: string;
};

type EditGroupFormProps = {
  group: ExamGroup;
  exams: ExamOption[];
};

const initialState: UpdateGroupState = {
  success: false,
  message: "",
};

export function EditGroupForm({
  group,
  exams,
}: EditGroupFormProps) {
  const updateGroupWithId = updateGroup.bind(null, group.id);

  const [state, formAction, pending] = useActionState(
    updateGroupWithId,
    initialState
  );

  return (
    <section className="mt-8 rounded-xl border p-6">
      <form action={formAction} className="space-y-5">
        <div>
          <label
            htmlFor="exam_id"
            className="mb-2 block text-sm font-medium"
          >
            Exam
          </label>

          <select
            id="exam_id"
            name="exam_id"
            required
            defaultValue={group.exam_id}
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
            htmlFor="name"
            className="mb-2 block text-sm font-medium"
          >
            Group name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={group.name}
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
            defaultValue={group.slug}
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
            defaultValue={group.description ?? ""}
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
            defaultValue={group.display_order}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <label className="flex items-center gap-3">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={group.is_active}
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