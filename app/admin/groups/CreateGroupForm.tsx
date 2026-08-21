"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { SeoFields } from "@/components/admin/SeoFields";
import { createGroup, type CreateGroupState } from "./actions";
import { PaperListInput } from "./PaperListInput";
import { SpecializationPapersInput } from "./SpecializationPapersInput";

type CategoryOption = { id: string; name: string };
type ExistingExam = { id: string; categoryId: string; name: string; slug: string };
type CreateGroupFormProps = { categories: CategoryOption[]; existingExams: ExistingExam[]; initialCategoryId?: string; onExamCategoryChange?: (examId: string) => void };
const initialState: CreateGroupState = { success: false, message: "" };

export function CreateGroupForm({ categories, existingExams, initialCategoryId = "", onExamCategoryChange }: CreateGroupFormProps) {
  const [state, formAction, pending] = useActionState(createGroup, initialState);
  const [examId, setExamId] = useState(initialCategoryId);
  const [name, setName] = useState("");
  const [showExistingNames, setShowExistingNames] = useState(false);
  const nameAreaRef = useRef<HTMLDivElement>(null);
  const categoryName = useMemo(() => categories.find((category) => category.id === examId)?.name ?? "", [categories, examId]);
  const categoryExams = useMemo(() => existingExams.filter((exam) => exam.categoryId === examId), [examId, existingExams]);
  const matchingExams = useMemo(() => { const query = name.trim().toLowerCase(); return categoryExams.filter((exam) => !query || exam.name.toLowerCase().includes(query)); }, [categoryExams, name]);
  const duplicate = categoryExams.some((exam) => exam.name.trim().toLowerCase() === name.trim().toLowerCase());

  function chooseExamCategory(nextExamId: string) {
    setExamId(nextExamId);
    setName("");
    setShowExistingNames(false);
    onExamCategoryChange?.(nextExamId);
  }

  useEffect(() => {
    function closeWhenClickingAway(event: MouseEvent) {
      if (nameAreaRef.current && !nameAreaRef.current.contains(event.target as Node)) {
        setShowExistingNames(false);
      }
    }
    document.addEventListener("mousedown", closeWhenClickingAway);
    return () => document.removeEventListener("mousedown", closeWhenClickingAway);
  }, []);

  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Add Exam</h2>
      <p className="mt-1 text-sm text-slate-600">Create the Exam, then add optional Specialisations and the Papers under each one. Nothing is pre-defined.</p>
      <form action={formAction} className="mt-6 space-y-5">
        <label className="block text-sm font-bold">
          Exam Category
          <SearchableSelect name="exam_id" value={examId} onChange={chooseExamCategory} options={categories.map((category) => ({ value: category.id, label: category.name }))} placeholder="Search and choose an Exam Category" />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <div ref={nameAreaRef}>
            <label className="block text-sm font-bold">
              Exam name
              <input id="name" name="name" type="text" required value={name} onFocus={() => setShowExistingNames(true)} onChange={(event) => { setName(event.target.value); setShowExistingNames(true); }} disabled={!examId} placeholder="For example: AEE" className="mt-2 w-full rounded-lg border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100" />
            </label>
            {categoryName && showExistingNames && (
              <div className="mt-3 overflow-hidden rounded-xl border">
                {matchingExams.length === 0 ? (
                  <p className="bg-slate-50 px-3 py-3 text-sm text-slate-600">{categoryExams.length === 0 ? "No Exams in this category yet. Enter a new Exam name." : "No matching Exam names. You can create this new name."}</p>
                ) : (
                  <div className="max-h-[12.5rem] divide-y overflow-y-auto bg-white">
                    {matchingExams.map((exam) => <p key={exam.id} className="px-3 py-2.5 text-sm font-semibold text-slate-800">{exam.name}</p>)}
                  </div>
                )}
                <p className="border-t bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">{matchingExams.length === categoryExams.length ? `${categoryExams.length} existing ${categoryExams.length === 1 ? "Exam" : "Exams"}` : `${matchingExams.length} matching of ${categoryExams.length} existing Exams`}</p>
              </div>
            )}
            {duplicate && <p className="mt-2 text-sm font-semibold text-red-600">An Exam named “{name.trim()}” already exists under {categoryName}. Choose a different name or edit the existing Exam below.</p>}
          </div>

          <label className="block text-sm font-bold">
            Slug
            <input id="slug" name="slug" type="text" required pattern="[a-z0-9-]+" placeholder="For example: aee" className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" />
            <span className="mt-1 block text-xs font-normal text-slate-500">Lowercase letters, numbers and hyphens only.</span>
          </label>
        </div>

        <label className="block text-sm font-bold">Description <span className="font-normal text-slate-500">optional</span><textarea id="description" name="description" rows={3} placeholder="Short introduction for students" className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /></label>
        <SeoFields titlePlaceholder="Exam name Mock Test – Free Online Tests" descriptionPlaceholder="Take free online mock tests for this exam with timed practice and answer review." />
        <div className="max-w-xs"><label className="block text-sm font-bold">Display order<input id="display_order" name="display_order" type="number" min="0" step="1" required placeholder="For example: 1" className="mt-2 w-full rounded-lg border px-4 py-3 font-normal" /></label></div>
        <SpecializationPapersInput />
        <PaperListInput inputName="papers_json" initialRows={0} title="Direct / common Papers" description="Add Papers that belong directly to this Exam. Use this for Group 1, Group 2, and Group 4, or for a Paper shared by every Specialisation." />
        <label className="flex items-center gap-3"><input name="is_active" type="checkbox" defaultChecked className="h-4 w-4" /><span className="text-sm font-medium">Available to students</span></label>
        <button type="submit" disabled={pending || categories.length === 0 || !examId || duplicate} aria-busy={pending} className="rounded-lg bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><PendingButtonContent pending={pending} pendingLabel="Creating exam…">Create Exam</PendingButtonContent></button>
        {state.message && <p aria-live="polite" className={state.success ? "text-sm font-semibold text-green-700" : "text-sm font-semibold text-red-600"}>{state.message}</p>}
      </form>
    </section>
  );
}
