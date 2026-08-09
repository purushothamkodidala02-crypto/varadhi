"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DeleteSubjectButton } from "./DeleteSubjectButton";
import type { SubjectContentLanguageMode } from "@/types/subject";

type ExistingSubject = {
  id: string;
  paperId: string;
  name: string;
  slug: string;
  contentLanguageMode: SubjectContentLanguageMode;
  isActive: boolean;
};
type ReturnLocation = { categoryId: string; examId: string; specializationId: string; paperId: string };

const pageSize = 20;

export function ExistingSubjectsTable({
  categoryName,
  examName,
  specializationName,
  paperId,
  paperName,
  returnLocation,
  subjects,
}: {
  categoryName: string | null;
  examName: string | null;
  specializationName: string | null;
  paperId: string;
  paperName: string | null;
  returnLocation: ReturnLocation;
  subjects: ExistingSubject[];
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subjects.filter(
      (subject) =>
        subject.paperId === paperId &&
        (!query || `${subject.name} ${subject.slug}`.toLowerCase().includes(query)),
    );
  }, [paperId, search, subjects]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleSubjects = filtered.slice((page - 1) * pageSize, page * pageSize);
  const firstEntry = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastEntry = Math.min(page * pageSize, filtered.length);

  useEffect(() => {
    setSearch("");
    setPage(1);
  }, [paperId]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-bold">Existing Subjects</h2>
          {[categoryName, examName, specializationName, paperName].filter(Boolean).map((name) => (
            <span
              key={name}
              className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="mt-1 text-sm text-slate-600">
          This list follows the Category, Exam, and Paper selected above in Add Subjects.
        </p>
      </div>

      <div className="border-b bg-slate-50 px-6 py-5">
        <label className="block max-w-xl text-sm font-bold">
          Search existing Subjects
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="For example: History or General Studies"
            disabled={!paperId}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      {!paperId ? (
        <p className="p-6 text-sm text-slate-600">
          Choose an Exam Category, Exam, and Paper in Add Subjects to see existing Subjects.
        </p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">
          No Subjects match this Paper and search.
        </p>
      ) : (
        <>
          <div className="max-h-[48rem] overflow-auto">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Question language</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-5 py-4">
                      <p className="font-bold">{subject.name}</p>
                      <p className="text-xs text-slate-500">{subject.slug}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {subject.contentLanguageMode === "bilingual" ? "English + Telugu" : subject.contentLanguageMode === "telugu" ? "Telugu only" : "English only"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${subject.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                      >
                        {subject.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/subjects/${subject.id}/edit?fromCategory=${returnLocation.categoryId}&fromExam=${returnLocation.examId}&fromSpecialization=${returnLocation.specializationId}&fromPaper=${returnLocation.paperId}`}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
                        >
                          Edit
                        </Link>
                        <DeleteSubjectButton subjectId={subject.id} subjectName={subject.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-6 py-4 text-sm">
            <p className="text-slate-600">
              Showing {firstEntry}–{lastEntry} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border bg-white px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-semibold text-slate-600">
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={page === pageCount}
                className="rounded-lg border bg-white px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
