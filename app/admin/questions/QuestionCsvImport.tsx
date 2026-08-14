"use client";

import { useActionState, useMemo, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { importQuestionsFromCsv, type ImportQuestionsState } from "./import-actions";

type Category = { id: string; name: string };
type Exam = { id: string; categoryId: string; name: string };
type Specialization = { id: string; examId: string; name: string };
type Paper = { id: string; examId: string; specializationId: string | null; name: string };
const initialState: ImportQuestionsState = { success: false, message: "" };

export function QuestionCsvImport({ categories, exams, specializations, papers }: {
  categories: Category[];
  exams: Exam[];
  specializations: Specialization[];
  papers: Paper[];
}) {
  const [state, action, pending] = useActionState(importQuestionsFromCsv, initialState);
  const [categoryId, setCategoryId] = useState("");
  const [examId, setExamId] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [paperId, setPaperId] = useState("");
  const visibleExams = useMemo(() => exams.filter((exam) => exam.categoryId === categoryId), [categoryId, exams]);
  const visibleSpecializations = useMemo(() => specializations.filter((item) => item.examId === examId), [specializations, examId]);
  const visiblePapers = useMemo(() => papers.filter((paper) => paper.examId === examId && (specializationId ? paper.specializationId === specializationId : !paper.specializationId)), [papers, examId, specializationId]);

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="border-b bg-teal-50/50 px-7 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Fast import</p>
        <h2 className="mt-2 text-2xl font-black">Add Questions from Excel or CSV</h2>
        <p className="mt-2 text-sm text-slate-600">Upload Excel directly for the fastest workflow. Choose the Paper first; every row is checked before Questions are saved.</p>
      </div>
      <form action={action} className="p-6 sm:p-7">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-bold">Exam Category<SearchableSelect name="import_exam_id" value={categoryId} onChange={(value) => { setCategoryId(value); setExamId(""); setSpecializationId(""); setPaperId(""); }} options={categories.map((item) => ({ value: item.id, label: item.name }))} placeholder="Search and choose a category" /></label>
          <label className="block text-sm font-bold">Exam<SearchableSelect name="import_exam_group_id" value={examId} onChange={(value) => { setExamId(value); setSpecializationId(""); setPaperId(""); }} options={visibleExams.map((item) => ({ value: item.id, label: item.name }))} placeholder="Search and choose an Exam" disabled={!categoryId} /></label>
          <label className="block text-sm font-bold">Specialisation <span className="font-normal text-slate-500">(optional)</span><SearchableSelect value={specializationId} onChange={(value) => { setSpecializationId(value); setPaperId(""); }} options={[{ value: "", label: visibleSpecializations.length ? "No specialisation — direct Papers" : "No specialisation" }, ...visibleSpecializations.map((item) => ({ value: item.id, label: item.name }))]} placeholder="Choose a Specialisation" disabled={!examId} emptyMessage="No Specialisations in this Exam." /></label>
          <label className="block text-sm font-bold">Paper<SearchableSelect name="import_paper_id" value={paperId} onChange={setPaperId} options={visiblePapers.map((item) => ({ value: item.id, label: item.name }))} placeholder="Choose a Paper" disabled={!examId} emptyMessage="No Papers in this selection." /></label>
        </div>
        <label className="mt-6 block rounded-2xl border border-dashed bg-slate-50 p-5 text-sm font-bold">
          Excel or CSV file
          <input name="questions_file" type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" required disabled={!paperId} className="mt-3 block w-full text-sm font-normal file:mr-4 file:rounded-lg file:border-0 file:bg-slate-950 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white disabled:cursor-not-allowed" />
          <span className="mt-3 block text-xs font-normal leading-5 text-slate-600">Use .xlsx for the speed option, or CSV as a fallback. Up to 500 Questions or 2.5 MB.</span>
        </label>
        <details className="mt-5 rounded-xl border bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-bold">Excel headings and language rules</summary>
          <p className="mt-3 text-sm leading-6 text-slate-700">Keep the headings in row 1. The system reads the <strong>Varadhi Import</strong> sheet when available, otherwise the first sheet.</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">Required headings: <code className="rounded bg-white px-1.5 py-1 text-xs">import_key, subject, question_en, option_a_en, option_b_en, option_c_en, option_d_en, question_te, option_a_te, option_b_te, option_c_te, option_d_te, correct_answer</code></p>
          <p className="mt-3 text-sm leading-6 text-slate-700">Optional image heading: <code className="rounded bg-white px-1.5 py-1 text-xs">image_url</code>. Add a public HTTPS link to a PNG, JPG, WebP, chart, map, or diagram. Leave it blank for text-only Questions.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Extra spaces at the start or end of cells are removed automatically.</li>
            <li><strong>General subjects:</strong> fill both English and Telugu fields.</li>
            <li><strong>English/Telugu language subjects:</strong> fill only that language.</li>
            <li>The Subject name must already exist under the selected Paper.</li>
          </ul>
        </details>
        <button disabled={pending || !paperId} className="mt-6 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Checking and importing..." : "Import Excel or CSV"}</button>
        {state.message && <p aria-live="polite" className={`mt-4 text-sm font-semibold ${state.success ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>}
      </form>
    </section>
  );
}
