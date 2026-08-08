"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { DeleteGroupButton } from "./DeleteGroupButton";

type Category = { id: string; name: string };
type ExistingExam = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
};

export function ExistingExamsTable({
  categories,
  exams,
}: {
  categories: Category[];
  exams: ExistingExam[];
}) {
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exams.filter(
      (exam) =>
        exam.categoryId === categoryId &&
        (!query || `${exam.name} ${exam.slug}`.toLowerCase().includes(query)),
    );
  }, [categoryId, exams, search]);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-6 py-5">
        <h2 className="font-bold">Existing Exams</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose an Exam Category to browse only its Exams.
        </p>
      </div>
      <div className="grid gap-3 border-b bg-slate-50 px-6 py-5 md:grid-cols-2">
        <label className="block text-sm font-bold">
          Exam Category
          <SearchableSelect
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            placeholder="Search and choose a category"
          />
        </label>
        <label className="block text-sm font-bold">
          Search existing Exams
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="For example: Group 2 or executive officer"
            disabled={!categoryId}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      {!categoryId ? (
        <p className="p-6 text-sm text-slate-600">
          Select an Exam Category above to see its existing Exams.
        </p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">
          No Exams match this category and search.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Exam</th>
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
      )}
    </section>
  );
}
