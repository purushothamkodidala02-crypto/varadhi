"use client";

import { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import type { SubjectContentLanguageMode } from "@/types/subject";

type SubjectDraft = { key: number; name: string; contentLanguageMode: SubjectContentLanguageMode };

const languageModes = [
  { value: "bilingual", label: "English + Telugu" },
  { value: "english", label: "English only" },
  { value: "telugu", label: "Telugu only" },
];

export function SubjectListInput({ resetKey = 0 }: { resetKey?: number }) {
  const newDraft = (key: number): SubjectDraft => ({ key, name: "", contentLanguageMode: "bilingual" });
  const [subjects, setSubjects] = useState<SubjectDraft[]>([newDraft(1)]);
  useEffect(() => { setSubjects([newDraft(1)]); }, [resetKey]);

  return <section className="rounded-xl border border-teal-100 bg-teal-50/50 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-950">Subjects</h3><p className="mt-1 text-sm text-slate-600">Use bilingual for general studies. Choose one language only for English or Telugu language subjects.</p></div><button type="button" onClick={() => setSubjects((current) => [...current, newDraft(Math.max(0, ...current.map((subject) => subject.key)) + 1)])} className="rounded-lg border border-teal-700 px-3 py-2 text-sm font-bold text-teal-800 hover:bg-white">+ Add Subject</button></div><div className="mt-4 space-y-3">{subjects.map((subject, index) => <div key={subject.key} className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"><label className="min-w-64 flex-1 text-sm font-semibold">Subject {index + 1} name<input required value={subject.name} onChange={(event) => setSubjects((current) => current.map((item) => item.key === subject.key ? { ...item, name: event.target.value } : item))} placeholder="For example: Indian History" className="mt-1.5 w-full rounded-lg border px-3 py-2.5 font-normal" /></label><label className="min-w-52 flex-1 text-sm font-semibold">Question language<SearchableSelect value={subject.contentLanguageMode} onChange={(value) => setSubjects((current) => current.map((item) => item.key === subject.key ? { ...item, contentLanguageMode: value as SubjectContentLanguageMode } : item))} options={languageModes} placeholder="Choose language" /></label><button type="button" onClick={() => setSubjects((current) => current.filter((item) => item.key !== subject.key))} className="pb-2 text-sm font-semibold text-red-600 hover:underline">Remove</button></div>)}</div><input type="hidden" name="subjects_json" value={JSON.stringify(subjects.map(({ name, contentLanguageMode }) => ({ name, contentLanguageMode })))} /></section>;
}
