"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { DeletePaperButton } from "@/app/admin/papers/DeletePaperButton";
import { PaperForm } from "@/app/admin/papers/PaperForm";

type Specialization = { id: string; name: string };
type Paper = { id: string; specializationId: string | null; name: string; slug: string; durationMinutes: number | null; questionCount: number | null; isActive: boolean };

export function ExamPaperManager({ examId, examName, specializations, papers }: { examId: string; examName: string; specializations: Specialization[]; papers: Paper[] }) {
  const [specializationId, setSpecializationId] = useState("");
  const selectedName = specializations.find((item) => item.id === specializationId)?.name;
  const visiblePapers = useMemo(() => papers.filter((paper) => paper.specializationId === (specializationId || null)), [papers, specializationId]);

  return <section className="mt-8 rounded-2xl border bg-slate-50 p-6"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Exam structure</p><h2 className="mt-2 text-xl font-bold">Papers in {examName}</h2><p className="mt-1 text-sm text-slate-600">Choose a Specialisation first. If you choose Direct / common Papers, the Paper belongs to {examName} itself.</p></div><label className="mt-5 block max-w-xl text-sm font-bold">Specialisation<SearchableSelect value={specializationId} onChange={setSpecializationId} options={[{ value: "", label: "Direct / common Papers" }, ...specializations.map((item) => ({ value: item.id, label: item.name }))]} placeholder="Choose a Specialisation" /></label><div className="mt-6 rounded-xl border bg-white p-5"><h3 className="font-bold">{selectedName ? `${selectedName} Papers` : `${examName} direct Papers`}</h3>{visiblePapers.length === 0 ? <p className="mt-3 text-sm text-slate-600">No Papers added here yet.</p> : <div className="mt-4 grid gap-3 md:grid-cols-2">{visiblePapers.map((paper) => <div key={paper.id} className="rounded-lg border bg-white px-4 py-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{paper.name}</p><p className="mt-1 text-xs text-slate-500">{paper.questionCount ? `${paper.questionCount} questions` : "Question count not set"}{paper.durationMinutes ? ` · ${paper.durationMinutes} min` : ""}{!paper.isActive ? " · Inactive" : ""}</p></div><div className="flex shrink-0 items-start gap-3"><Link href={`/admin/papers/${paper.id}/edit`} className="text-xs font-bold text-teal-700 hover:underline">Edit</Link><DeletePaperButton paperId={paper.id} paperName={paper.name} /></div></div></div>)}</div>}</div><PaperForm key={specializationId || "direct"} exams={[{ id: examId, label: examName }]} specializations={specializations.map((item) => ({ id: item.id, examId, name: item.name }))} fixedExam={{ id: examId, label: examName }} fixedSpecializationId={specializationId || null} /></section>;
}
