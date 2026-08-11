"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeleteGroupButton } from "./DeleteGroupButton";

type ExistingExam = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
};

const pageSize = 20;

export function ExistingExamsTable({
  categoryId,
  categoryName,
  exams,
}: {
  categoryId: string;
  categoryName: string | null;
  exams: ExistingExam[];
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exams.filter(
      (exam) =>
        exam.categoryId === categoryId &&
        (!query || `${exam.name} ${exam.slug}`.toLowerCase().includes(query)),
    );
  }, [categoryId, exams, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visiblePage = Math.min(page, pageCount);
  const visibleExams = filtered.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);
  const firstEntry = filtered.length === 0 ? 0 : (visiblePage - 1) * pageSize + 1;
  const lastEntry = Math.min(visiblePage * pageSize, filtered.length);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-bold">Existing Exams</h2>
          {categoryName && (
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
              {categoryName}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-600">
          This list follows the Exam Category selected above in Add Exam.
        </p>
      </div>

      <div className="border-b bg-slate-50 px-6 py-5">
        <label className="block max-w-xl text-sm font-bold">
          Search existing Exams
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="For example: Group 2 or Executive Officer"
            disabled={!categoryId}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      {!categoryId ? (
        <p className="p-6 text-sm text-slate-600">
          Choose an Exam Category in Add Exam to see its existing Exams.
        </p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">
          No Exams match this category and search.
        </p>
      ) : (
        <>
          <div className="max-h-[48rem] overflow-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Exam</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleExams.map((exam) => (
                  <tr key={exam.id}>
                    <td className="px-5 py-4 font-bold">{exam.name}</td>
                    <td className="px-5 py-4 text-slate-600">{exam.slug}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${exam.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                      >
                        {exam.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">{exam.displayOrder}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/groups/${exam.id}/edit`}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
                        >
                          Edit
                        </Link>
                        <DeleteGroupButton groupId={exam.id} groupName={exam.name} />
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
                disabled={visiblePage === 1}
                className="rounded-lg border bg-white px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-semibold text-slate-600">
                Page {visiblePage} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={visiblePage === pageCount}
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
