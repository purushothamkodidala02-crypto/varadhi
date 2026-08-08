"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  LocationFilters,
  type LocationCategory,
  type LocationExam,
  type LocationFilterValue,
  type LocationPaper,
} from "@/components/admin/LocationFilters";
import { DeleteSubjectButton } from "./DeleteSubjectButton";

type ExistingSubject = {
  id: string;
  categoryId: string;
  examId: string;
  paperId: string;
  examName: string;
  paperName: string;
  name: string;
  slug: string;
  isActive: boolean;
};

const emptyLocation: LocationFilterValue = {
  categoryId: "",
  examId: "",
  paperId: "",
  subjectId: "",
};

export function ExistingSubjectsTable({
  categories,
  exams,
  papers,
  subjects,
}: {
  categories: LocationCategory[];
  exams: LocationExam[];
  papers: LocationPaper[];
  subjects: ExistingSubject[];
}) {
  const [location, setLocation] = useState(emptyLocation);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subjects.filter(
      (subject) =>
        subject.categoryId === location.categoryId &&
        (!location.examId || subject.examId === location.examId) &&
        (!location.paperId || subject.paperId === location.paperId) &&
        (!query || `${subject.name} ${subject.slug}`.toLowerCase().includes(query)),
    );
  }, [location, search, subjects]);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-6 py-5">
        <h2 className="font-bold">Existing Subjects</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose a location, then search the Subjects already stored there.
        </p>
      </div>
      <div className="space-y-4 border-b bg-slate-50 px-6 py-5">
        <LocationFilters
          categories={categories}
          exams={exams}
          papers={papers}
          value={location}
          onChange={setLocation}
        />
        <label className="block max-w-xl text-sm font-bold">
          Search existing Subjects
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="For example: History or General Studies"
            disabled={!location.categoryId}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      {!location.categoryId ? (
        <p className="p-6 text-sm text-slate-600">
          Select an Exam Category above to see its Subjects.
        </p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">
          No Subjects match this location and search.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {!location.examId && <th className="px-5 py-3">Exam</th>}
                {!location.paperId && <th className="px-5 py-3">Paper</th>}
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((subject) => (
                <tr key={subject.id}>
                  {!location.examId && (
                    <td className="px-5 py-4 text-slate-600">{subject.examName}</td>
                  )}
                  {!location.paperId && (
                    <td className="px-5 py-4 text-slate-600">{subject.paperName}</td>
                  )}
                  <td className="px-5 py-4">
                    <p className="font-bold">{subject.name}</p>
                    <p className="text-xs text-slate-500">{subject.slug}</p>
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
                        href={`/admin/subjects/${subject.id}/edit`}
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
      )}
    </section>
  );
}
