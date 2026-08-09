"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { DeletePaperButton } from "./DeletePaperButton";

type Exam = { id: string; label: string };
type Specialization = { id: string; examId: string; name: string };
type ExistingPaper = {
  id: string;
  examId: string;
  specializationId: string | null;
  specializationName: string | null;
  name: string;
  slug: string;
  durationMinutes: number | null;
  questionCount: number | null;
  isActive: boolean;
};

export function ExistingPapersTable({
  exams,
  specializations,
  papers,
}: {
  exams: Exam[];
  specializations: Specialization[];
  papers: ExistingPaper[];
}) {
  const [examId, setExamId] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [search, setSearch] = useState("");
  const availableSpecializations = useMemo(
    () => specializations.filter((specialization) => specialization.examId === examId),
    [examId, specializations],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return papers.filter(
      (paper) =>
        paper.examId === examId &&
        (!specializationId || paper.specializationId === specializationId) &&
        (!query || `${paper.name} ${paper.slug}`.toLowerCase().includes(query)),
    );
  }, [examId, papers, search, specializationId]);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-6 py-5">
        <h2 className="font-bold">Existing Papers</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose an Exam to browse only its Papers.
        </p>
      </div>
      <div className="grid gap-3 border-b bg-slate-50 px-6 py-5 md:grid-cols-3">
        <label className="block text-sm font-bold">
          Exam
          <SearchableSelect
            value={examId}
            onChange={(value) => { setExamId(value); setSpecializationId(""); }}
            options={exams.map((exam) => ({ value: exam.id, label: exam.label }))}
            placeholder="Search and choose an Exam"
          />
        </label>
        <label className="block text-sm font-bold">
          Specialisation <span className="font-normal text-slate-500">(optional)</span>
          <SearchableSelect
            value={specializationId}
            onChange={setSpecializationId}
            options={[
              { value: "", label: availableSpecializations.length ? "All Specialisations and direct Papers" : "No specialisation" },
              ...availableSpecializations.map((specialization) => ({ value: specialization.id, label: specialization.name })),
            ]}
            placeholder="Choose a Specialisation"
            disabled={!examId}
            emptyMessage="No Specialisations in this Exam."
          />
        </label>
        <label className="block text-sm font-bold">
          Search existing Papers
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="For example: Paper I"
            disabled={!examId}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      {!examId ? (
        <p className="p-6 text-sm text-slate-600">Select an Exam above to see its Papers.</p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">No Papers match this Exam and search.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Paper</th>
                <th className="px-5 py-3">Specialisation</th>
                <th className="px-5 py-3">Structure</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((paper) => (
                <tr key={paper.id}>
                  <td className="px-5 py-4">
                    <p className="font-bold">{paper.name}</p>
                    <p className="text-xs text-slate-500">{paper.slug}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{paper.specializationName ?? "Direct to Exam"}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {paper.questionCount
                      ? `${paper.questionCount} questions`
                      : "Question count not set"}
                    {paper.durationMinutes ? ` · ${paper.durationMinutes} min` : ""}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${paper.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                    >
                      {paper.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/papers/${paper.id}/edit`}
                        className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
                      >
                        Edit
                      </Link>
                      <DeletePaperButton paperId={paper.id} paperName={paper.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
