"use client";

import { useActionState, useMemo, useState } from "react";
import { createSubjects, type CreateSubjectState } from "./actions";
import { SubjectListInput } from "./SubjectListInput";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

type Category = { id: string; name: string };
type Exam = { id: string; exam_id: string; name: string };
type Paper = { id: string; exam_group_id: string; name: string };
const initialState: CreateSubjectState = { success: false, message: "" };

export function CreateSubjectForm({ categories, exams, papers }: { categories: Category[]; exams: Exam[]; papers: Paper[] }) {
  const [categoryId, setCategoryId] = useState("");
  const [examId, setExamId] = useState("");
  const [paperId, setPaperId] = useState("");
  const availableExams = useMemo(() => exams.filter((exam) => exam.exam_id === categoryId), [categoryId, exams]);
  const availablePapers = useMemo(() => papers.filter((paper) => paper.exam_group_id === examId), [examId, papers]);
  const [state, formAction, pending] = useActionState(createSubjects, initialState);

  function changeCategory(nextCategoryId: string) { setCategoryId(nextCategoryId); setExamId(""); setPaperId(""); }
  function changeExam(nextExamId: string) { setExamId(nextExamId); setPaperId(""); }

  return <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Add Subjects</h2><p className="mt-1 text-sm text-slate-600">First choose where the Subjects belong, then add all of their names together.</p><form action={formAction} className="mt-6 space-y-5"><div className="grid gap-5 md:grid-cols-3"><label className="block text-sm font-bold">Exam Category<SearchableSelect name="exam_category_id" value={categoryId} onChange={changeCategory} options={categories.map((category) => ({ value: category.id, label: category.name }))} placeholder="Search and choose a category" /></label><label className="block text-sm font-bold">Exam<SearchableSelect name="exam_group_id" value={examId} onChange={changeExam} options={availableExams.map((exam) => ({ value: exam.id, label: exam.name }))} placeholder="Search and choose an Exam" disabled={!categoryId} emptyMessage="No Exams in this category." /></label><label className="block text-sm font-bold">Paper<SearchableSelect name="paper_id" value={paperId} onChange={setPaperId} options={availablePapers.map((paper) => ({ value: paper.id, label: paper.name }))} placeholder="Search and choose a Paper" disabled={!examId} emptyMessage="No Papers in this Exam." /></label></div><SubjectListInput /><button disabled={pending || !paperId} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{pending ? "Adding..." : "Add Subjects"}</button>{state.message && <p aria-live="polite" className={`text-sm font-semibold ${state.success ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>}</form></section>;
}
