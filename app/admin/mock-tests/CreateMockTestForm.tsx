"use client";

import { useActionState, useState } from "react";
import {
  createMockTest,
  type CreateMockTestState,
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

type CreateMockTestFormProps = {
  groups: GroupOption[];
  subjects: SubjectOption[];
};

const initialState: CreateMockTestState = {
  success: false,
  message: "",
};

export function CreateMockTestForm({
  groups,
  subjects,
}: CreateMockTestFormProps) {
  const initialGroupId = groups[0]?.id ?? "";

  const initialSubjectId =
    subjects.find(
      (subject) =>
        subject.examGroupId === initialGroupId
    )?.id ?? "";

  const [selectedGroupId, setSelectedGroupId] =
    useState(initialGroupId);

  const [selectedSubjectId, setSelectedSubjectId] =
    useState(initialSubjectId);
  const [accessType, setAccessType] = useState<"free" | "paid">("free");

  const [state, formAction, pending] = useActionState(
    createMockTest,
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
      <h2 className="text-xl font-semibold">
        Add Mock Test
      </h2>

      <form action={formAction} className="mt-6 space-y-5">
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
              <option
                key={subject.id}
                value={subject.id}
              >
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
            type="text"
            required
            defaultValue="Current Affairs Mock Test 1"
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
            defaultValue="current-affairs-mock-test-1"
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
            defaultValue="Practice Current Affairs questions for TGPSC Group I."
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
            defaultValue="Answer all questions within the allotted time."
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
            defaultValue="30"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <input name="status" type="hidden" value="draft" />

        <p className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
          New Mock Tests are created as drafts. Add at least one Question
          before publishing.
        </p>

        <div>
          <label htmlFor="access_type" className="mb-2 block text-sm font-medium">Student access</label>
          <select id="access_type" name="access_type" value={accessType} onChange={(event) => setAccessType(event.target.value as "free" | "paid")} className="w-full rounded-lg border px-4 py-3"><option value="free">Free</option><option value="paid">Paid</option></select>
        </div>

        {accessType === "paid" && <div><label htmlFor="price_inr" className="mb-2 block text-sm font-medium">Price (₹)</label><input id="price_inr" name="price_inr" type="number" min="1" step="0.01" required className="w-full rounded-lg border px-4 py-3" placeholder="99" /></div>}

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

        <button
          type="submit"
          disabled={pending || groups.length === 0}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add Mock Test"}
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
