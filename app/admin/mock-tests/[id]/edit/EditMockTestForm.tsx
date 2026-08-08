"use client";

import { useActionState, useState } from "react";
import type { MockTest } from "@/types/mock-test";
import {
  updateMockTest,
  type UpdateMockTestState,
} from "./actions";

type GroupOption = {
  id: string;
  label: string;
};

type SubjectOption = {
  id: string;
  examGroupId: string;
  name: string;
};

type EditMockTestFormProps = {
  mockTest: MockTest;
  groups: GroupOption[];
  subjects: SubjectOption[];
};

const initialState: UpdateMockTestState = {
  success: false,
  message: "",
};

export function EditMockTestForm({
  mockTest,
  groups,
  subjects,
}: EditMockTestFormProps) {
  const [selectedGroupId, setSelectedGroupId] =
    useState(mockTest.exam_group_id);

  const [selectedSubjectId, setSelectedSubjectId] =
    useState(mockTest.subject_id ?? "");
  const [accessType, setAccessType] = useState(mockTest.access_type);

  const updateMockTestWithId = updateMockTest.bind(
    null,
    mockTest.id
  );

  const [state, formAction, pending] = useActionState(
    updateMockTestWithId,
    initialState
  );

  const availableSubjects = subjects.filter(
    (subject) =>
      subject.examGroupId === selectedGroupId
  );

  function handleGroupChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const nextGroupId = event.target.value;
    setSelectedGroupId(nextGroupId);

    const firstSubject = subjects.find(
      (subject) =>
        subject.examGroupId === nextGroupId
    );

    setSelectedSubjectId(firstSubject?.id ?? "");
  }

  return (
    <section className="mt-8 rounded-xl border p-6">
      <form action={formAction} className="space-y-5">
        <div>
          <label
            htmlFor="exam_group_id"
            className="mb-2 block text-sm font-medium"
          >
            Exam
          </label>

          <select
            id="exam_group_id"
            name="exam_group_id"
            required
            value={selectedGroupId}
            onChange={handleGroupChange}
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
          <label htmlFor="access_type" className="mb-2 block text-sm font-medium">Student access</label>
          <select id="access_type" name="access_type" value={accessType} onChange={(event) => setAccessType(event.target.value as "free" | "paid")} className="w-full rounded-lg border px-4 py-3"><option value="free">Free</option><option value="paid">Paid</option></select>
        </div>

        {accessType === "paid" && <div><label htmlFor="price_inr" className="mb-2 block text-sm font-medium">Price (₹)</label><input id="price_inr" name="price_inr" type="number" min="1" step="0.01" required defaultValue={mockTest.price_inr ?? ""} className="w-full rounded-lg border px-4 py-3" /></div>}

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
            value={selectedSubjectId}
            onChange={(event) =>
              setSelectedSubjectId(event.target.value)
            }
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="">General / No Subject</option>

            {availableSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium"
          >
            Mock Test title
          </label>

          <input
            id="title"
            name="title"
            required
            defaultValue={mockTest.title}
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
            required
            pattern="[a-z0-9-]+"
            defaultValue={mockTest.slug}
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
            defaultValue={mockTest.description ?? ""}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="instructions"
            className="mb-2 block text-sm font-medium"
          >
            Instructions
          </label>

          <textarea
            id="instructions"
            name="instructions"
            rows={3}
            defaultValue={mockTest.instructions ?? ""}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="duration_minutes"
            className="mb-2 block text-sm font-medium"
          >
            Duration in minutes
          </label>

          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={mockTest.duration_minutes}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-medium"
          >
            Status
          </label>

          <select
            id="status"
            name="status"
            defaultValue={mockTest.status}
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
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
            defaultValue={mockTest.display_order}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
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
