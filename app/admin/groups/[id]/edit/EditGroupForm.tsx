"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ExamGroup } from "@/types/group";
import { PaperListInput } from "../../PaperListInput";
import { updateGroup, type UpdateGroupState } from "./actions";

type ExamOption = { id: string; name: string };
type ExistingPaper = { id: string; name: string; duration_minutes: number | null; question_count: number | null; is_active: boolean };
type EditGroupFormProps = { group: ExamGroup; exams: ExamOption[]; papers: ExistingPaper[] };
const initialState: UpdateGroupState = { success: false, message: "" };

export function EditGroupForm({ group, exams, papers }: EditGroupFormProps) {
  const updateGroupWithId = updateGroup.bind(null, group.id);
  const [state, formAction, pending] = useActionState(updateGroupWithId, initialState);

  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
      <form action={formAction} className="space-y-5">
        <label className="block text-sm font-bold">Exam Category<select id="exam_id" name="exam_id" required defaultValue={group.exam_id} className="mt-2 w-full rounded-lg border px-4 py-3 font-normal">{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select></label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-bold">Exam name<input id="name" name="name" type="text" required defaultValue={group.name} className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /></label>
          <label className="block text-sm font-bold">Slug<input id="slug" name="slug" type="text" required pattern="[a-z0-9-]+" defaultValue={group.slug} className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /></label>
        </div>

        <label className="block text-sm font-bold">Description <span className="font-normal text-slate-500">optional</span><textarea id="description" name="description" rows={4} defaultValue={group.description ?? ""} className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /></label>

        <div className="max-w-xs"><label className="block text-sm font-bold">Display order<input id="display_order" name="display_order" type="number" min="0" step="1" required defaultValue={group.display_order} className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /></label></div>

        <section className="rounded-xl border bg-slate-50 p-5"><div><h3 className="font-bold">Current Papers</h3><p className="mt-1 text-sm text-slate-600">Use each Paper’s settings to change its duration, question count, and default scoring.</p></div>{papers.length === 0 ? <p className="mt-4 text-sm text-slate-600">No Papers added yet.</p> : <div className="mt-4 grid gap-3 md:grid-cols-2">{papers.map((paper) => <div key={paper.id} className="rounded-lg border bg-white px-4 py-3"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{paper.name}</p><Link href={`/admin/papers/${paper.id}/edit`} className="shrink-0 text-xs font-bold text-teal-700 hover:underline">Edit settings</Link></div><p className="mt-1 text-xs text-slate-500">{paper.question_count ? `${paper.question_count} questions` : "Question count not set"}{paper.duration_minutes ? ` · ${paper.duration_minutes} min` : ""}{!paper.is_active ? " · Inactive" : ""}</p></div>)}</div>}</section>

        <PaperListInput inputName="new_papers_json" initialRows={0} title="Add Papers" description="Need another Paper? Click “Add Paper” and enter its name. The existing Papers above are not changed." />

        <label className="flex items-center gap-3"><input name="is_active" type="checkbox" defaultChecked={group.is_active} className="h-4 w-4" /><span className="text-sm font-medium">Available to students</span></label>

        <button type="submit" disabled={pending} className="rounded-lg bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Saving..." : "Save Exam"}</button>
        {state.message && <p aria-live="polite" className={state.success ? "text-sm font-semibold text-green-700" : "text-sm font-semibold text-red-600"}>{state.message}</p>}
      </form>
    </section>
  );
}
