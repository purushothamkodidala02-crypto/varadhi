"use client";

import { useActionState, useMemo, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import type { MockTest, MockTestAccessType, MockTestStatus } from "@/types/mock-test";
import { updateMockTest, type UpdateMockTestState } from "./actions";

type Paper = { id: string; label: string; duration: number | null };
type Subject = { id: string; paperId: string; name: string };

const initialState: UpdateMockTestState = { success: false, message: "" };

export function EditMockTestForm({
  mockTest,
  papers,
  subjects,
}: {
  mockTest: MockTest;
  papers: Paper[];
  subjects: Subject[];
}) {
  const [state, action, pending] = useActionState(
    updateMockTest.bind(null, mockTest.id),
    initialState,
  );
  const [paperId, setPaperId] = useState(mockTest.paper_id);
  const [subjectId, setSubjectId] = useState(mockTest.subject_id ?? "");
  const [scope, setScope] = useState(mockTest.test_scope);
  const [status, setStatus] = useState<MockTestStatus>(mockTest.status);
  const [accessType, setAccessType] = useState<MockTestAccessType>(
    mockTest.access_type,
  );
  const availableSubjects = useMemo(
    () => subjects.filter((subject) => subject.paperId === paperId),
    [subjects, paperId],
  );

  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
      <form action={action} className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-bold md:col-span-2">
          Paper
          <SearchableSelect
            name="paper_id"
            value={paperId}
            onChange={(value) => {
              setPaperId(value);
              setSubjectId("");
            }}
            options={papers.map((paper) => ({ value: paper.id, label: paper.label }))}
            placeholder="Search for a paper"
          />
        </label>

        <fieldset className="rounded-xl border p-4">
          <legend className="px-1 text-sm font-bold">Mock type</legend>
          <label className="flex gap-2 text-sm">
            <input
              name="test_scope"
              type="radio"
              value="paper"
              checked={scope === "paper"}
              onChange={() => setScope("paper")}
            />
            Paper-wise
          </label>
          <label className="mt-2 flex gap-2 text-sm">
            <input
              name="test_scope"
              type="radio"
              value="subject"
              checked={scope === "subject"}
              onChange={() => setScope("subject")}
            />
            Subject-wise
          </label>
        </fieldset>

        {scope === "subject" && (
          <label className="block text-sm font-bold">
            Subject
            <SearchableSelect
              name="subject_id"
              value={subjectId}
              onChange={setSubjectId}
              options={availableSubjects.map((subject) => ({
                value: subject.id,
                label: subject.name,
              }))}
              placeholder="Search for a subject"
              emptyMessage="Add a Subject to this Paper first."
            />
          </label>
        )}

        <label className="block text-sm font-bold">
          Title
          <input
            name="title"
            required
            defaultValue={mockTest.title}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-bold">
          Slug
          <input
            name="slug"
            required
            defaultValue={mockTest.slug}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-bold md:col-span-2">
          Description
          <textarea
            name="description"
            rows={3}
            defaultValue={mockTest.description ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-bold">
          Duration in minutes
          <input
            name="duration_minutes"
            type="number"
            min="1"
            required
            defaultValue={mockTest.duration_minutes}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-bold">
          Display order
          <input
            name="display_order"
            type="number"
            min="0"
            required
            defaultValue={mockTest.display_order}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-bold">
          Status
          <SearchableSelect
            name="status"
            value={status}
            onChange={(value) => setStatus(value as MockTestStatus)}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
            placeholder="Search a status"
          />
        </label>
        <label className="block text-sm font-bold">
          Student access
          <SearchableSelect
            name="access_type"
            value={accessType}
            onChange={(value) => setAccessType(value as MockTestAccessType)}
            options={[
              { value: "free", label: "Free" },
              { value: "paid", label: "Paid" },
            ]}
            placeholder="Search an access type"
          />
        </label>
        {accessType === "paid" && (
          <label className="block text-sm font-bold">
            Price in ₹
            <input
              name="price_inr"
              type="number"
              min="1"
              step="0.01"
              required
              defaultValue={mockTest.price_inr ?? ""}
              className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
            />
          </label>
        )}
        <div className="md:col-span-2">
          <button
            disabled={pending}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save Mock Test"}
          </button>
          {state.message && (
            <p
              className={`mt-4 text-sm font-semibold ${state.success ? "text-emerald-700" : "text-red-700"}`}
            >
              {state.message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
