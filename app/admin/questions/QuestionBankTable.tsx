"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import type { QuestionLifecycle } from "@/types/question";
import { DeleteQuestionButton } from "./DeleteQuestionButton";

export type QuestionBankRow = {
  id: string;
  questionText: string;
  correctAnswer: string;
  isActive: boolean;
  contentLifecycle: QuestionLifecycle;
  reviewOn: string | null;
  expiresOn: string | null;
  categoryName: string;
  examName: string;
  paperName: string;
  subjectName: string;
  subjectKey: string;
};

function statusOf(question: QuestionBankRow) {
  const today = new Date().toISOString().slice(0, 10);

  if (!question.isActive) {
    return { label: "Inactive", className: "bg-slate-200 text-slate-700" };
  }
  if (question.expiresOn && question.expiresOn < today) {
    return { label: "Expired", className: "bg-rose-100 text-rose-800" };
  }
  if (
    question.contentLifecycle === "review" &&
    question.reviewOn &&
    question.reviewOn <= today
  ) {
    return { label: "Review due", className: "bg-amber-100 text-amber-800" };
  }

  return {
    label:
      question.contentLifecycle === "permanent"
        ? "Permanent"
        : question.contentLifecycle === "review"
          ? `Review ${question.reviewOn}`
          : `Expires ${question.expiresOn}`,
    className:
      question.contentLifecycle === "permanent"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-sky-100 text-sky-800",
  };
}

export function QuestionBankTable({ questions }: { questions: QuestionBankRow[] }) {
  const [search, setSearch] = useState("");
  const [subjectKey, setSubjectKey] = useState("all");
  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Map(
          questions.map((question) => [
            question.subjectKey,
            `${question.categoryName} → ${question.examName} → ${question.paperName} → ${question.subjectName}`,
          ]),
        ).entries(),
      ),
    [questions],
  );
  const filtered = useMemo(
    () =>
      questions.filter(
        (question) =>
          (subjectKey === "all" || question.subjectKey === subjectKey) &&
          (!search.trim() ||
            `${question.questionText} ${question.paperName} ${question.subjectName}`
              .toLowerCase()
              .includes(search.trim().toLowerCase())),
      ),
    [questions, search, subjectKey],
  );

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Existing questions</h2>
          <p className="mt-1 text-sm text-slate-600">
            A question can be assigned to many mocks, but always stays in its own
            Paper and Subject.
          </p>
        </div>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold">
          {filtered.length} of {questions.length}
        </span>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-bold">
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search question text or subject"
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <label className="text-sm font-bold">
          Subject
          <SearchableSelect
            value={subjectKey}
            onChange={setSubjectKey}
            options={[
              { value: "all", label: "All Subjects" },
              ...subjectOptions.map(([value, label]) => ({ value, label })),
            ]}
            placeholder="Search a subject"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-600">
          No questions yet.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border bg-white">
          <table className="min-w-[980px] w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Classification</th>
                <th className="px-5 py-4">Question</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Answer</th>
                <th className="px-5 py-4 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((question) => {
                const status = statusOf(question);

                return (
                  <tr key={question.id} className="align-top">
                    <td className="px-5 py-5 text-sm">
                      <p className="font-bold">{question.examName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {question.categoryName} → {question.paperName} → {question.subjectName}
                      </p>
                    </td>
                    <td className="max-w-xl px-5 py-5 font-semibold leading-6">
                      {question.questionText}
                    </td>
                    <td className="px-5 py-5">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <span className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-sm font-black text-teal-800">
                        Option {question.correctAnswer}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/questions/${question.id}/edit`}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
                        >
                          Edit
                        </Link>
                        <DeleteQuestionButton
                          questionId={question.id}
                          questionText={question.questionText}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
