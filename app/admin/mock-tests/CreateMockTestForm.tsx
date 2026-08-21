"use client";

import { useActionState, useMemo, useState } from "react";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";
import { MockSymbol, StateSymbol } from "@/components/exams/CatalogSymbols";
import { mockTestLabel } from "@/lib/exam-catalog";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { createMockTest, type CreateMockTestState } from "./actions";

type ExamState = { id: string; name: string; code: string; slug: string };
type Category = { id: string; stateId: string; name: string };
type Exam = { id: string; categoryId: string; name: string };
type Specialization = { id: string; examId: string; name: string };
type Paper = { id: string; examId: string; specializationId: string | null; name: string; duration: number | null; number: number };
type Subject = { id: string; paperId: string; name: string };
type ExistingSeries = { paperId: string; subjectId: string | null; scope: "paper" | "subject"; seriesNumber: number };

const initialState: CreateMockTestState = { success: false, message: "" };

export function CreateMockTestForm({ states, categories, exams, specializations, papers, subjects, existingSeries }: {
  states: ExamState[];
  categories: Category[];
  exams: Exam[];
  specializations: Specialization[];
  papers: Paper[];
  subjects: Subject[];
  existingSeries: ExistingSeries[];
}) {
  const [result, action, pending] = useActionState(createMockTest, initialState);
  const [stateId, setStateId] = useState(states[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [examId, setExamId] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [paperId, setPaperId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [scope, setScope] = useState<"paper" | "subject">("paper");
  const state = states.find((item) => item.id === stateId);
  const availableCategories = useMemo(() => categories.filter((item) => item.stateId === stateId), [categories, stateId]);
  const availableExams = useMemo(() => exams.filter((item) => item.categoryId === categoryId), [exams, categoryId]);
  const availableSpecializations = useMemo(() => specializations.filter((item) => item.examId === examId), [examId, specializations]);
  const availablePapers = useMemo(() => papers.filter((item) => item.examId === examId && (specializationId ? item.specializationId === specializationId : !item.specializationId)), [papers, examId, specializationId]);
  const availableSubjects = useMemo(() => subjects.filter((item) => item.paperId === paperId), [subjects, paperId]);
  const exam = exams.find((item) => item.id === examId);
  const paper = papers.find((item) => item.id === paperId);
  const subject = subjects.find((item) => item.id === subjectId);
  const currentNumbers = existingSeries.filter((item) => item.paperId === paperId && item.scope === scope && (scope === "paper" || item.subjectId === subjectId)).map((item) => item.seriesNumber);
  const nextSeries = currentNumbers.length ? Math.max(...currentNumbers) + 1 : 1;

  function resetAfterState(value: string) { setStateId(value); setCategoryId(""); setExamId(""); setSpecializationId(""); setPaperId(""); setSubjectId(""); }
  function resetAfterCategory(value: string) { setCategoryId(value); setExamId(""); setSpecializationId(""); setPaperId(""); setSubjectId(""); }
  function resetAfterExam(value: string) { setExamId(value); setSpecializationId(""); setPaperId(""); setSubjectId(""); }
  function resetAfterSpecialization(value: string) { setSpecializationId(value); setPaperId(""); setSubjectId(""); }

  return <section className="mt-6 overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm">
    <div className="border-b bg-gradient-to-r from-slate-950 to-teal-950 px-6 py-6 text-white sm:px-7"><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-300 text-slate-950"><MockSymbol /></span><div><p className="text-xs font-black uppercase tracking-[0.14em] text-teal-200">Guided test creator</p><h2 className="font-display mt-1 text-2xl">Create the next mock in its correct series</h2></div></div><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Select the location from left to right. Varadhi generates the test number, full name and URL automatically.</p></div>
    <form action={action} className="grid gap-5 p-6 md:grid-cols-2 sm:p-7">
      <label className="block text-sm font-bold">1. State / catalogue
        <select name="state_id" value={stateId} onChange={(event) => resetAfterState(event.target.value)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal">
          {states.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-bold">2. Recruiting board<SearchableSelect name="exam_id" value={categoryId} onChange={resetAfterCategory} options={availableCategories.map((item) => ({ value: item.id, label: item.name }))} placeholder="Choose TGPSC, APPSC, DSC…" /></label>
      <label className="block text-sm font-bold">3. Exam<SearchableSelect name="exam_group_id" value={examId} onChange={resetAfterExam} options={availableExams.map((item) => ({ value: item.id, label: item.name }))} placeholder="Choose Executive Officer, Group 2…" disabled={!categoryId} /></label>
      <label className="block text-sm font-bold">Specialisation <span className="font-normal text-slate-500">(only when applicable)</span><SearchableSelect value={specializationId} onChange={resetAfterSpecialization} options={[{ value: "", label: availableSpecializations.length ? "Common / direct papers" : "No specialisation" }, ...availableSpecializations.map((item) => ({ value: item.id, label: item.name }))]} placeholder="Choose specialisation" disabled={!examId} /></label>
      <label className="block text-sm font-bold md:col-span-2">4. Paper<SearchableSelect name="paper_id" value={paperId} onChange={(value) => { setPaperId(value); setSubjectId(""); }} options={availablePapers.map((item) => ({ value: item.id, label: `Paper ${item.number} · ${item.name}` }))} placeholder="Choose the exact paper" disabled={!examId} emptyMessage="No papers exist in this selection." /></label>
      <fieldset className="rounded-2xl border bg-slate-50 p-4"><legend className="px-1 text-sm font-bold">Practice coverage</legend><label className="mt-1 flex gap-3 text-sm"><input name="test_scope" type="radio" value="paper" checked={scope === "paper"} onChange={() => { setScope("paper"); setSubjectId(""); }} />Full paper mock</label><label className="mt-3 flex gap-3 text-sm"><input name="test_scope" type="radio" value="subject" checked={scope === "subject"} onChange={() => setScope("subject")} />One subject only</label></fieldset>
      {scope === "subject" ? <label className="block text-sm font-bold">Subject<SearchableSelect name="subject_id" value={subjectId} onChange={setSubjectId} options={availableSubjects.map((item) => ({ value: item.id, label: item.name }))} placeholder="Choose a subject" disabled={!paperId} /></label> : <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900"><strong>Full paper selected</strong><p className="mt-1 leading-5">Questions can cover every subject assigned to this paper.</p></div>}

      <div className="md:col-span-2 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-4">{state && <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-teal-200"><StateSymbol slug={state.slug} className="h-5 w-5" /></span>}<div><p className="text-xs font-black uppercase tracking-[0.13em] text-teal-700">Student-facing name preview</p><h3 className="font-display mt-1 text-xl">{paper ? mockTestLabel(nextSeries) : "Choose a paper to generate the name"}</h3>{paper && <p className="mt-1 text-sm font-semibold text-slate-600">{state?.code} · {exam?.name} · Paper {paper.number}{subject ? ` · ${subject.name}` : ""}</p>}</div></div>{paper && <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-teal-800 shadow-sm">Next in series: {nextSeries}</span>}</div>
        <input type="hidden" name="expected_series_number" value={nextSeries} />
      </div>

      <label className="block text-sm font-bold md:col-span-2">Description <span className="font-normal text-slate-500">(optional)</span><textarea name="description" rows={3} placeholder="Tell students what this mock covers" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
      <label className="block text-sm font-bold">Duration in minutes<input name="duration_minutes" type="number" min="1" required defaultValue={paper?.duration ?? 150} key={paperId || "duration"} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><strong>Student access: Free</strong><p className="mt-1 leading-5">Paid tests stay disabled until a verified payment flow is available.</p><input type="hidden" name="access_type" value="free" /></div>
      <div className="md:col-span-2"><button disabled={pending || !paperId || (scope === "subject" && !subjectId)} aria-busy={pending} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"><PendingButtonContent pending={pending} pendingLabel="Creating draft…">Create {paper ? mockTestLabel(nextSeries) : "mock test"}</PendingButtonContent></button>{result.message && <p aria-live="polite" className={`mt-4 text-sm font-semibold ${result.success ? "text-emerald-700" : "text-red-700"}`}>{result.message}</p>}</div>
    </form>
  </section>;
}
