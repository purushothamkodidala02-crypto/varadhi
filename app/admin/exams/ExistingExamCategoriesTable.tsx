"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Exam } from "@/types/exam";
import { DeleteExamButton } from "./DeleteExamButton";

export function ExistingExamCategoriesTable({ exams }: { exams: Exam[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exams.filter(
      (exam) => !query || `${exam.name} ${exam.slug}`.toLowerCase().includes(query),
    );
  }, [exams, search]);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-6 py-5">
        <h2 className="font-bold">Existing Exam Categories</h2>
      </div>
      <div className="border-b bg-slate-50 px-6 py-5">
        <label className="block max-w-xl text-sm font-bold">
          Search existing Exam Categories
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="For example: TGPSC or TET"
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">No Exam Categories match your search.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((exam) => (
                <tr key={exam.id}>
                  <td className="px-5 py-4 font-bold">{exam.name}</td>
                  <td className="px-5 py-4 text-slate-600">{exam.slug}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${exam.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                    >
                      {exam.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">{exam.display_order}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/exams/${exam.id}/edit`}
                        className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
                      >
                        Edit
                      </Link>
                      <DeleteExamButton examId={exam.id} examName={exam.name} />
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
