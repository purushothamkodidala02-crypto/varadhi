"use client";

import { useActionState, useState } from "react";
import { createGroup, type CreateGroupState } from "./actions";
import { PaperListInput } from "./PaperListInput";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

type ExamOption = { id: string; name: string };
type CreateGroupFormProps = { exams: ExamOption[] };
const initialState: CreateGroupState = { success: false, message: "" };

export function CreateGroupForm({ exams }: CreateGroupFormProps) {
  const [state, formAction, pending] = useActionState(createGroup, initialState);
  const [examId, setExamId] = useState("");

  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Add Exam</h2>
      <p className="mt-1 text-sm text-slate-600">Choose the Exam Category, enter the Exam name, then add its actual Papers. Nothing is pre-defined.</p>

      <form action={formAction} className="mt-6 space-y-5">
        <label className="block text-sm font-bold">Exam Category<SearchableSelect name="exam_id" value={examId} onChange={setExamId} options={exams.map((exam) => ({ value: exam.id, label: exam.name }))} placeholder="Search and choose an Exam Category" /></label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-bold">Exam name<input id="name" name="name" type="text" required placeholder="For example: Group 2" className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /></label>
          <label className="block text-sm font-bold">Slug<input id="slug" name="slug" type="text" required pattern="[a-z0-9-]+" placeholder="For example: group-2" className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /><span className="mt-1 block text-xs font-normal text-slate-500">Lowercase letters, numbers and hyphens only.</span></label>
        </div>

        <label className="block text-sm font-bold">Description <span className="font-normal text-slate-500">optional</span><textarea id="description" name="description" rows={3} placeholder="Short introduction for students" className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /></label>

        <div className="max-w-xs"><label className="block text-sm font-bold">Display order<input id="display_order" name="display_order" type="number" min="0" step="1" required placeholder="For example: 1" className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /></label></div>

        <PaperListInput inputName="papers_json" />

        <label className="flex items-center gap-3"><input name="is_active" type="checkbox" defaultChecked className="h-4 w-4" /><span className="text-sm font-medium">Available to students</span></label>

        <button type="submit" disabled={pending || exams.length === 0} className="rounded-lg bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Creating..." : "Create Exam and Papers"}</button>

        {state.message && <p aria-live="polite" className={state.success ? "text-sm font-semibold text-green-700" : "text-sm font-semibold text-red-600"}>{state.message}</p>}
      </form>
    </section>
  );
}
