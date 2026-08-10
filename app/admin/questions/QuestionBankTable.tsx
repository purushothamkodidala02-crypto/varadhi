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
  type LocationSubject,
} from "@/components/admin/LocationFilters";
import { FormattedQuestionText } from "@/components/questions/FormattedQuestionText";
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
  categoryId: string;
  examId: string;
  specializationId: string;
  paperId: string;
  subjectId: string;
  examName: string;
  paperName: string;
  subjectName: string;
};

const emptyLocation: LocationFilterValue = {
  categoryId: "",
  examId: "",
  specializationId: "",
  paperId: "",
  subjectId: "",
};

function statusOf(question: QuestionBankRow) {
  const today = new Date().toISOString().slice(0, 10);

  if (!question.isActive) {
    return { label: "Unavailable", className: "bg-slate-200 text-slate-700" };
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
        ? "Available"
        : question.contentLifecycle === "review"
          ? `Review ${question.reviewOn}`
          : `Expires ${question.expiresOn}`,
    className:
      question.contentLifecycle === "permanent"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-sky-100 text-sky-800",
  };
}

export function QuestionBankTable({
  categories,
  exams,
  specializations,
  papers,
  subjects,
  questions,
}: {
  categories: LocationCategory[];
  exams: LocationExam[];
  specializations: LocationSpecialization[];
  papers: LocationPaper[];
  subjects: LocationSubject[];
  questions: QuestionBankRow[];
}) {
  const [location, setLocation] = useState(emptyLocation);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return questions.filter(
      (question) =>
        question.categoryId === location.categoryId &&
        (!location.examId || question.examId === location.examId) &&
        (!location.specializationId || question.specializationId === location.specializationId) &&
        (!location.paperId || question.paperId === location.paperId) &&
        (!location.subjectId || question.subjectId === location.subjectId) &&
        (!query ||
          `${question.questionText} ${question.subjectName}`
            .toLowerCase()
            .includes(query)),
    );
  }, [location, questions, search]);

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-6 py-5">
        <h2 className="text-2xl font-black">Existing questions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Browse the reusable Question Bank by where each question belongs.
        </p>
      </div>
      <div className="space-y-4 border-b bg-slate-50 px-6 py-5">
        <LocationFilters
          categories={categories}
          exams={exams}
          specializations={specializations}
          papers={papers}
          subjects={subjects}
          value={location}
          onChange={setLocation}
          includeSubjects
        />
        <label className="block max-w-xl text-sm font-bold">
          Search existing questions
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type a word from the question"
            disabled={!location.categoryId}
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      {!location.categoryId ? (
        <p className="p-6 text-sm text-slate-600">
          Select an Exam Category above to see its questions.
        </p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">
          No questions match this location and search.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {!location.examId && <th className="px-5 py-4">Exam</th>}
                {!location.paperId && <th className="px-5 py-4">Paper</th>}
                {!location.subjectId && <th className="px-5 py-4">Subject</th>}
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
                    {!location.examId && (
                      <td className="px-5 py-5 text-sm text-slate-600">
                        {question.examName}
                      </td>
                    )}
                    {!location.paperId && (
                      <td className="px-5 py-5 text-sm text-slate-600">
                        {question.paperName}
                      </td>
                    )}
                    {!location.subjectId && (
                      <td className="px-5 py-5 text-sm text-slate-600">
                        {question.subjectName}
                      </td>
                    )}
                    <td className="max-w-xl px-5 py-5 font-semibold leading-6">
                      <FormattedQuestionText text={question.questionText} />
                    </td>
                    <td className="px-5 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                      >
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
