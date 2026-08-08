"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { createSubjects, type CreateSubjectState } from "./actions";
import { SubjectListInput } from "./SubjectListInput";

type Category = { id: string; name: string };
type Exam = { id: string; exam_id: string; name: string };
type Paper = { id: string; exam_group_id: string; name: string };
const initialState: CreateSubjectState = { success: false, message: "" };

export function CreateSubjectForm({ categories, exams, papers }: { categories: Category[]; exams: Exam[]; papers: Paper[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const categoryExams = useMemo(() => exams.filter((exam) => exam.exam_id === categoryId), [categoryId, exams]);
  const [examId, setExamId] = useState(categoryExams[0]?.id ?? "");
  const availableExams = categoryExams.some((exam) => exam.id === examId) ? categoryExams : categoryExams;
  const selectedExamId = availableExams.some((exam) => exam.id === examId) ? examId : (availableExams[0]?.id ?? "");
  const examPapers = useMemo(() => papers.filter((paper) => paper.exam_group_id === selectedExamId), [papers, selectedExamId]);
  const [paperId, setPaperId] = useState(examPapers[0]?.id ?? "");
  const selectedPaperId = examPapers.some((paper) => paper.id === paperId) ? paperId : (examPapers[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(createSubjects, initialState);

  function changeCategory(nextCategoryId: string) {
    const nextExams = exams.filter((exam) => exam.exam_id === nextCategoryId);
    const nextExamId = nextExams[0]?.id ?? "";
    setCategoryId(nextCategoryId); setExamId(nextExamId); setPaperId(papers.find((paper) => paper.exam_group_id === nextExamId)?.id ?? "");
  }
  function changeExam(nextExamId: string) { setExamId(nextExamId); setPaperId(papers.find((paper) => paper.exam_group_id === nextExamId)?.id ?? ""); }

  return <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Add Subjects</h2><p className="mt-1 text-sm text-slate-600">First choose where the Subjects belong, then add all of their names together.</p><form action={formAction} className="mt-6 space-y-5"><div className="grid gap-5 md:grid-cols-3"><label className="block text-sm font-bold">Exam Category<select name="exam_category_id" required value={categoryId} onChange={(event) => changeCategory(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="block text-sm font-bold">Exam<select name="exam_group_id" required value={selectedExamId} onChange={(event) => changeExam(event.target.value)} disabled={availableExams.length === 0} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:bg-slate-100"><option value="">Choose an Exam</option>{availableExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select></label><label className="block text-sm font-bold">Paper<select name="paper_id" required value={selectedPaperId} onChange={(event) => setPaperId(event.target.value)} disabled={examPapers.length === 0} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:bg-slate-100"><option value="">Choose a Paper</option>{examPapers.map((paper) => <option key={paper.id} value={paper.id}>{paper.name}</option>)}</select></label></div><SubjectListInput /><button disabled={pending || !selectedPaperId} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{pending ? "Adding..." : "Add Subjects"}</button>{state.message && <p aria-live="polite" className={`text-sm font-semibold ${state.success ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>}</form></section>;
}
