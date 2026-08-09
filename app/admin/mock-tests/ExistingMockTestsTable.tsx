"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  LocationFilters,
  type LocationCategory,
  type LocationExam,
  type LocationFilterValue,
  type LocationPaper,
  type LocationSpecialization,
} from "@/components/admin/LocationFilters";
import type { MockTestStatus } from "@/types/mock-test";
import { MockTestManagementButtons } from "./MockTestManagementButtons";

type ExistingMockTest = {
  id: string;
  categoryId: string;
  examId: string;
  specializationId: string;
  paperId: string;
  examName: string;
  paperName: string;
  title: string;
  slug: string;
  durationMinutes: number;
  scope: "paper" | "subject";
  subjectName: string | null;
  status: MockTestStatus;
  accessType: "free" | "paid";
  priceInr: number | null;
  createdAt: string;
};

const emptyLocation: LocationFilterValue = {
  categoryId: "",
  examId: "",
  specializationId: "",
  paperId: "",
  subjectId: "",
};

export function ExistingMockTestsTable({
  categories,
  exams,
  specializations,
  papers,
  tests,
}: {
  categories: LocationCategory[];
  exams: LocationExam[];
  specializations: LocationSpecialization[];
  papers: LocationPaper[];
  tests: ExistingMockTest[];
}) {
  const [location, setLocation] = useState(emptyLocation);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tests.filter(
      (test) =>
        test.categoryId === location.categoryId &&
        (!location.examId || test.examId === location.examId) &&
        (!location.specializationId || test.specializationId === location.specializationId) &&
        (!location.paperId || test.paperId === location.paperId) &&
        (!query || `${test.title} ${test.slug}`.toLowerCase().includes(query)),
    );
  }, [location, search, tests]);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-6 py-5">
        <h2 className="font-bold">Existing Mock Tests</h2>
        <p className="mt-1 text-sm text-slate-600">
          Browse Mock Tests under one Exam Category, Exam, or Paper.
        </p>
      </div>
      <div className="space-y-4 border-b bg-slate-50 px-6 py-5">
        <LocationFilters
          categories={categories}
          exams={exams}
          specializations={specializations}
          papers={papers}
          value={location}
          onChange={setLocation}
        />
        <label className="block max-w-xl text-sm font-bold">
          Search existing Mock Tests
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="For example: Paper I Mock Test 1"
            disabled={!location.categoryId}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      {!location.categoryId ? (
        <p className="p-6 text-sm text-slate-600">
          Select an Exam Category above to see its Mock Tests.
        </p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">
          No Mock Tests match this location and search.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {!location.examId && <th className="px-5 py-3">Exam</th>}
                {!location.paperId && <th className="px-5 py-3">Paper</th>}
                <th className="px-5 py-3">Mock Test</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((test) => (
                <tr key={test.id}>
                  {!location.examId && (
                    <td className="px-5 py-4 text-slate-600">{test.examName}</td>
                  )}
                  {!location.paperId && (
                    <td className="px-5 py-4 text-slate-600">{test.paperName}</td>
                  )}
                  <td className="px-5 py-4">
                    <p className="font-bold">{test.title}</p>
                    <p className="text-xs text-slate-500">
                      {test.durationMinutes} min · {test.accessType === "paid" ? `₹${test.priceInr}` : "Free"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-slate-600">
                    {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(test.createdAt))}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">
                      {test.scope === "paper" ? "Paper-wise" : "Subject-wise"}
                    </p>
                    {test.subjectName && (
                      <p className="text-xs text-slate-500">{test.subjectName}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize">
                      {test.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/mock-tests/${test.id}/edit`}
                        className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
                      >
                        Edit
                      </Link>
                      <MockTestManagementButtons
                        mockTestId={test.id}
                        mockTestTitle={test.title}
                        status={test.status}
                      />
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
