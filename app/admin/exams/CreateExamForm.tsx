"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";
import { SeoFields } from "@/components/admin/SeoFields";
import { createExam, type CreateExamState } from "./actions";

type ExistingCategory = { id: string; stateId: string; name: string };
type ExamState = { id: string; name: string; code: string };

const initialState: CreateExamState = {
  success: false,
  message: "",
};

export function CreateExamForm({
  states,
  initialStateId,
  existingCategories,
}: {
  states: ExamState[];
  initialStateId: string;
  existingCategories: ExistingCategory[];
}) {
  const [state, formAction, pending] = useActionState(createExam, initialState);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [stateId, setStateId] = useState(initialStateId);
  const [listOpen, setListOpen] = useState(false);
  const normalizedName = name.trim().toLocaleLowerCase();
  const matchingCategories = useMemo(
    () =>
      existingCategories.filter(
        (category) =>
          category.stateId === stateId &&
          (!normalizedName || category.name.toLocaleLowerCase().includes(normalizedName)),
      ),
    [existingCategories, normalizedName, stateId],
  );
  const existingMatch = existingCategories.find(
    (category) => category.stateId === stateId && category.name.trim().toLocaleLowerCase() === normalizedName,
  );

  useEffect(() => {
    function closeWhenClickingAway(event: MouseEvent) {
      if (inputAreaRef.current && !inputAreaRef.current.contains(event.target as Node)) {
        setListOpen(false);
      }
    }

    document.addEventListener("mousedown", closeWhenClickingAway);
    return () => document.removeEventListener("mousedown", closeWhenClickingAway);
  }, []);

  return (
    <section className="mt-8 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">Add Exam Category</h2>
      <p className="mt-1 text-sm text-slate-600">
        Start typing to check whether the category already exists before creating it.
      </p>

      <form action={formAction} className="mt-6 space-y-5">
        <div>
          <label htmlFor="state_id" className="mb-2 block text-sm font-medium">State / catalogue</label>
          <select id="state_id" name="state_id" required value={stateId} onChange={(event) => { setStateId(event.target.value); setName(""); }} className="w-full rounded-lg border bg-white px-4 py-3">
            {states.map((state) => <option key={state.id} value={state.id}>{state.code} · {state.name}</option>)}
          </select>
        </div>
        <div ref={inputAreaRef} className="relative">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Exam category name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onFocus={() => setListOpen(true)}
            onChange={(event) => {
              setName(event.target.value);
              setListOpen(true);
            }}
            placeholder="For example: TGPSC"
            aria-controls="existing-category-suggestions"
            className="w-full rounded-lg border px-4 py-3"
          />

          {listOpen && normalizedName && (
            <div
              id="existing-category-suggestions"
              className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border bg-white p-1 shadow-xl shadow-slate-950/10"
            >
              {matchingCategories.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-500">
                  No matching category. You can create a new one.
                </p>
              ) : (
                matchingCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/admin/exams/${category.id}/edit`}
                    className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-teal-50"
                  >
                    <span className="font-bold">{category.name}</span>
                    <span className="ml-2 text-xs text-teal-700">Existing — open to edit</span>
                  </Link>
                ))
              )}
            </div>
          )}

          {existingMatch && (
            <p className="mt-2 text-sm font-semibold text-amber-800">
              “{existingMatch.name}” already exists. Open the existing category above instead
              of creating a duplicate.
            </p>
          )}
        </div>

        <SeoFields
          titlePlaceholder="State service commission mock tests"
          descriptionPlaceholder="Browse this exam category and its free online mock tests."
        />

        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-medium">
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
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
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
          <label htmlFor="display_order" className="mb-2 block text-sm font-medium">
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
          <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4" />
          <span className="text-sm font-medium">Active</span>
        </label>

        <button
          type="submit"
          disabled={pending || Boolean(existingMatch)}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PendingButtonContent pending={pending} pendingLabel="Adding category…">Add Exam Category</PendingButtonContent>
        </button>

        {state.message && (
          <p
            aria-live="polite"
            className={state.success ? "text-sm text-green-700" : "text-sm text-red-600"}
          >
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}
