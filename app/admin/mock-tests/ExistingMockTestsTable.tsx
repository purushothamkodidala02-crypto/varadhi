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
import { MockSymbol, StateSymbol } from "@/components/exams/CatalogSymbols";
import { mockTestLabel } from "@/lib/exam-catalog";
import { MockTestManagementButtons } from "./MockTestManagementButtons";
import { DownloadQuestionsButton } from "./DownloadQuestionsButton";

type ExistingMockTest = {
  id: string;
  stateId: string;
  stateName: string;
  stateCode: string;
  categoryId: string;
  examId: string;
  specializationId: string;
  paperId: string;
  examName: string;
  paperName: string;
  seriesNumber: number;
  title: string;
  slug: string;
  durationMinutes: number;
  scope: "paper" | "subject";
  subjectName: string | null;
  status: MockTestStatus;
  questionCount: number;
  usableQuestionCount: number;
  totalMarks: number;
  attemptCount: number;
};

const emptyLocation: LocationFilterValue = { categoryId: "", examId: "", specializationId: "", paperId: "", subjectId: "" };

const statusDetails: Record<MockTestStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-amber-100 text-amber-800" },
  published: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Hidden", className: "bg-slate-200 text-slate-700" },
};

const filterStyles = {
  all: {
    active: "border-slate-950 bg-slate-950 text-white ring-slate-950",
    idle: "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50",
  },
  draft: {
    active: "border-amber-400 bg-amber-50 text-amber-950 ring-amber-400",
    idle: "border-amber-100 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50",
  },
  published: {
    active: "border-emerald-500 bg-emerald-50 text-emerald-950 ring-emerald-500",
    idle: "border-emerald-100 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50",
  },
  archived: {
    active: "border-slate-500 bg-slate-100 text-slate-950 ring-slate-500",
    idle: "border-slate-200 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-100",
  },
};

export function ExistingMockTestsTable({ states, categories, exams, specializations, papers, tests }: {
  states: Array<{ id: string; name: string; code: string; slug: string }>;
  categories: Array<LocationCategory & { stateId: string }>;
  exams: LocationExam[];
  specializations: LocationSpecialization[];
  papers: LocationPaper[];
  tests: ExistingMockTest[];
}) {
  const [stateId, setStateId] = useState("");
  const [location, setLocation] = useState(emptyLocation);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MockTestStatus | "all">("all");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tests.filter((test) =>
      (!stateId || test.stateId === stateId) &&
      (!location.categoryId || test.categoryId === location.categoryId) &&
      (!location.examId || test.examId === location.examId) &&
      (!location.specializationId || test.specializationId === location.specializationId) &&
      (!location.paperId || test.paperId === location.paperId) &&
      (status === "all" || test.status === status) &&
      (!query || `${test.title} ${test.slug} ${test.examName} ${test.paperName}`.toLowerCase().includes(query)),
    );
  }, [location, search, stateId, status, tests]);

  const counts = {
    all: tests.length,
    draft: tests.filter((test) => test.status === "draft").length,
    published: tests.filter((test) => test.status === "published").length,
    archived: tests.filter((test) => test.status === "archived").length,
  };

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-lg shadow-slate-950/[0.04]">
      <div className="border-b border-teal-100 bg-gradient-to-br from-white via-white to-teal-50 px-6 py-6 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Student visibility</p>
        <h2 className="mt-2 text-2xl font-black">Manage all mock tests</h2>
        <p className="mt-2 text-sm text-slate-600">Mock tests are the single publishing control. Questions and Subjects remain reusable building blocks.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["all", "All tests", counts.all],
            ["draft", "Draft", counts.draft],
            ["published", "Published", counts.published],
            ["archived", "Hidden", counts.archived],
          ] as const).map(([value, label, count]) => (
            <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 ${status === value ? `ring-1 ${filterStyles[value].active}` : filterStyles[value].idle}`}>
              <span className="block text-2xl font-black">{count}</span>
              <span className={`mt-1 block text-sm font-semibold ${status === value && value === "all" ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-b border-teal-100 bg-gradient-to-r from-slate-50 to-teal-50/70 px-6 py-5 sm:px-7">
        <div><p className="mb-3 text-xs font-black uppercase tracking-[0.13em] text-slate-500">Filter by state</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setStateId(""); setLocation(emptyLocation); }} className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${!stateId ? "border-slate-950 bg-slate-950 text-white" : "bg-white text-slate-600"}`}>All states</button>{states.map((state) => <button key={state.id} type="button" onClick={() => { setStateId(state.id); setLocation(emptyLocation); }} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${stateId === state.id ? "border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600" : "bg-white text-slate-600"}`}><StateSymbol slug={state.slug} className="h-4 w-4" />{state.code} · {state.name}</button>)}</div></div>
        <LocationFilters categories={categories.filter((category) => !stateId || category.stateId === stateId)} exams={exams} specializations={specializations} papers={papers} value={location} onChange={setLocation} />
        <label className="block max-w-xl text-sm font-bold">Search mock tests
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by test, Exam, or Paper" className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal" />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center"><h3 className="font-bold text-slate-900">No matching mock tests</h3><p className="mt-2 text-sm text-slate-600">Change the visibility, location, or search filters.</p></div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((test) => {
            const unavailableCount = test.questionCount - test.usableQuestionCount;
            const ready = test.questionCount > 0 && unavailableCount === 0;
            const statusDetail = statusDetails[test.status];
            return (
              <article key={test.id} className="p-6 transition hover:bg-teal-50/25 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusDetail.className}`}>{statusDetail.label}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{test.scope === "paper" ? "Paper-wise" : "Subject-wise"}</span>
                    </div>
                    <div className="mt-3 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-teal-200"><MockSymbol className="h-5 w-5" /></span><div><h3 className="font-display text-xl text-slate-950">{mockTestLabel(test.seriesNumber)}</h3><p className="mt-1 text-sm font-semibold text-slate-700">{test.stateCode} · {test.examName} · {test.paperName}{test.subjectName ? ` · ${test.subjectName}` : ""}</p><p className="mt-1 text-xs text-slate-400">Stored title: {test.title}</p></div></div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {test.status === "published" && <Link href={`/mock-tests/${test.id}`} target="_blank" className="rounded-lg border px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">View live</Link>}
                    {test.questionCount > 0 ? <DownloadQuestionsButton mockTestId={test.id} /> : <span title="Add Questions before downloading" className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-400">No questions to download</span>}
                    <Link href={`/admin/mock-tests/${test.id}/edit`} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-800">Manage test</Link>
                    <MockTestManagementButtons mockTestId={test.id} mockTestTitle={test.title} status={test.status} ready={ready} />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Metric label="Questions" value={String(test.questionCount)} />
                  <Metric label="Usable" value={`${test.usableQuestionCount} / ${test.questionCount}`} warning={unavailableCount > 0} />
                  <Metric label="Total marks" value={test.totalMarks.toFixed(2).replace(/\.00$/, "")} />
                  <Metric label="Duration" value={`${test.durationMinutes} min`} />
                  <Metric label="Attempts" value={String(test.attemptCount)} />
                </div>

                {!ready && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{test.questionCount === 0 ? "Add at least one question before publishing." : `${unavailableCount} assigned question${unavailableCount === 1 ? " is" : "s are"} unavailable. Fix the questions before publishing.`}</p>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className={`rounded-xl border px-4 py-3 ${warning ? "border-amber-200 bg-amber-50" : "bg-slate-50"}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-lg font-black ${warning ? "text-amber-900" : "text-slate-950"}`}>{value}</p></div>;
}
