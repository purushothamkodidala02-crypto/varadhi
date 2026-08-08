"use client";

import { useState } from "react";

type PaperDraft = {
  key: number;
  name: string;
  duration_minutes: string;
  question_count: string;
};

type PaperListInputProps = {
  inputName: string;
  initialRows?: number;
  title?: string;
  description?: string;
};

function newPaper(key: number): PaperDraft {
  return { key, name: "", duration_minutes: "", question_count: "" };
}

export function PaperListInput({
  inputName,
  initialRows = 1,
  title = "Papers",
  description = "Add the real government Papers for this Exam. You can add more later.",
}: PaperListInputProps) {
  const [papers, setPapers] = useState<PaperDraft[]>(() =>
    Array.from({ length: initialRows }, (_, index) => newPaper(index + 1))
  );

  const updatePaper = (key: number, field: keyof Omit<PaperDraft, "key">, value: string) => {
    setPapers((current) => current.map((paper) => paper.key === key ? { ...paper, [field]: value } : paper));
  };

  return (
    <section className="rounded-xl border border-teal-100 bg-teal-50/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <button type="button" onClick={() => setPapers((current) => [...current, newPaper(Math.max(0, ...current.map((paper) => paper.key)) + 1)])} className="rounded-lg border border-teal-700 px-3 py-2 text-sm font-bold text-teal-800 hover:bg-white">
          + Add Paper
        </button>
      </div>

      {papers.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-teal-200 bg-white/70 p-3 text-sm text-slate-600">No new Papers selected. Use “Add Paper” when this Exam needs another Paper.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {papers.map((paper, index) => (
            <div key={paper.key} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem_auto] md:items-end">
              <label className="block text-sm font-semibold">Paper {index + 1} name<input required={initialRows > 0} value={paper.name} onChange={(event) => updatePaper(paper.key, "name", event.target.value)} placeholder="For example: Paper I – General Studies" className="mt-1.5 w-full rounded-lg border px-3 py-2.5 font-normal" /></label>
              <label className="block text-sm font-semibold">Minutes <span className="font-normal text-slate-500">optional</span><input type="number" min="1" value={paper.duration_minutes} onChange={(event) => updatePaper(paper.key, "duration_minutes", event.target.value)} placeholder="150" className="mt-1.5 w-full rounded-lg border px-3 py-2.5 font-normal" /></label>
              <label className="block text-sm font-semibold">Questions <span className="font-normal text-slate-500">optional</span><input type="number" min="1" value={paper.question_count} onChange={(event) => updatePaper(paper.key, "question_count", event.target.value)} placeholder="150" className="mt-1.5 w-full rounded-lg border px-3 py-2.5 font-normal" /></label>
              <button type="button" onClick={() => setPapers((current) => current.filter((item) => item.key !== paper.key))} className="pb-2 text-sm font-semibold text-red-600 hover:underline">Remove</button>
            </div>
          ))}
        </div>
      )}

      <input type="hidden" name={inputName} value={JSON.stringify(papers.map(({ name, duration_minutes, question_count }) => ({ name, duration_minutes, question_count })))} />
    </section>
  );
}
