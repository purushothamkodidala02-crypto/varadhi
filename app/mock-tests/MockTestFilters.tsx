"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Option = { id: string; name: string };
type Exam = Option & { categoryId: string };
type Paper = Option & { examId: string };
type Subject = Option & { paperId: string };
type InitialFilters = { q?: string; category?: string; exam?: string; paper?: string; subject?: string; type?: string };

export function MockTestFilters({ categories, exams, papers, subjects, initial }: { categories: Option[]; exams: Exam[]; papers: Paper[]; subjects: Subject[]; initial: InitialFilters }) {
  const [categoryId, setCategoryId] = useState(initial.category ?? "");
  const [examId, setExamId] = useState(initial.exam ?? "");
  const [paperId, setPaperId] = useState(initial.paper ?? "");
  const [subjectId, setSubjectId] = useState(initial.subject ?? "");
  const availableExams = useMemo(() => categoryId ? exams.filter((item) => item.categoryId === categoryId) : [], [categoryId, exams]);
  const availablePapers = useMemo(() => examId ? papers.filter((item) => item.examId === examId) : [], [examId, papers]);
  const availableSubjects = useMemo(() => paperId ? subjects.filter((item) => item.paperId === paperId) : [], [paperId, subjects]);
  const hasFilters = Boolean(initial.q?.trim() || initial.category || initial.exam || initial.paper || initial.subject || (initial.type && initial.type !== "all"));

  return <form className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Choose your practice</p><h2 className="mt-2 text-xl font-black">What do you want to practise today?</h2><p className="mt-2 text-sm text-slate-600">Choose the location in order, or search directly for a test or topic.</p></div>{hasFilters && <Link href="/mock-tests" className="text-sm font-bold text-teal-700 hover:text-teal-800">Clear all filters</Link>}</div>
    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-bold lg:col-span-2">Search by test or topic<input name="q" type="search" defaultValue={initial.q ?? ""} placeholder="For example: Mock Test 1, General Studies, or Current Affairs" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Enter a Mock Test name, Exam, Paper, Subject, or topic.</span></label>
      <label className="text-sm font-bold">Practice type<select name="type" defaultValue={initial.type ?? "all"} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"><option value="all">All test types</option><option value="paper">Full-length Paper tests</option><option value="subject">Subject tests</option></select></label>
      <label className="text-sm font-bold">1. Exam category<select name="category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setExamId(""); setPaperId(""); setSubjectId(""); }} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"><option value="">Choose a category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm font-bold">2. Exam<select name="exam" value={examId} onChange={(event) => { setExamId(event.target.value); setPaperId(""); setSubjectId(""); }} disabled={!categoryId} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"><option value="">{categoryId ? "All Exams in this category" : "Choose a category first"}</option>{availableExams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm font-bold">3. Paper<select name="paper" value={paperId} onChange={(event) => { setPaperId(event.target.value); setSubjectId(""); }} disabled={!examId} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"><option value="">{examId ? "All Papers in this Exam" : "Choose an Exam first"}</option>{availablePapers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm font-bold">4. Subject <span className="font-normal text-slate-500">(optional)</span><select name="subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!paperId} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"><option value="">{paperId ? "All Subjects in this Paper" : "Choose a Paper first"}</option>{availableSubjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="flex items-end"><button className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Show matching tests</button></div>
    </div>
  </form>;
}
