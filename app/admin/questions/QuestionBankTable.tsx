"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { indiaDateKey } from "@/lib/date";
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

function statusOf(question: QuestionBankRow) {
  const today = indiaDateKey();

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
  initialLocation,
  initialSearch,
  initialPage,
}: {
  categories: LocationCategory[];
  exams: LocationExam[];
  specializations: LocationSpecialization[];
  papers: LocationPaper[];
  subjects: LocationSubject[];
  initialLocation: LocationFilterValue;
  initialSearch: string;
  initialPage: number;
}) {
  const [location, setLocation] = useState(initialLocation);
  const [search, setSearch] = useState(initialSearch);
  const [questions, setQuestions] = useState<QuestionBankRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const pageSize = 50;

  const visibleSubjectIds = useMemo(() => {
    if (!location.categoryId) return [];
    const examIds = new Set(exams.filter((exam) => exam.categoryId === location.categoryId && (!location.examId || exam.id === location.examId)).map((exam) => exam.id));
    const paperIds = new Set(papers.filter((paper) => examIds.has(paper.examId) && (!location.specializationId || paper.specializationId === location.specializationId) && (!location.paperId || paper.id === location.paperId)).map((paper) => paper.id));
    return subjects.filter((subject) => paperIds.has(subject.paperId) && (!location.subjectId || subject.id === location.subjectId)).map((subject) => subject.id);
  }, [exams, location, papers, subjects]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (!location.categoryId || visibleSubjectIds.length === 0) {
          if (active) {
            setQuestions([]);
            setTotal(0);
            setLoadError("");
          }
          return;
        }
        setLoading(true);
        setLoadError("");
        const supabase = createClient();
        let query = supabase
          .from("questions")
          .select("id, subject_id, question_text, correct_answer, is_active, content_lifecycle, review_on, expires_on", { count: "exact" })
          .in("subject_id", visibleSubjectIds)
          .order("created_at", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);
        const normalizedSearch = search.trim().slice(0, 100);
        if (normalizedSearch) query = query.ilike("question_text", `%${normalizedSearch}%`);
        const { data, count, error } = await query;
        if (!active) return;
        if (error) {
          setQuestions([]);
          setTotal(0);
          setLoadError("Questions could not be loaded. Refresh and try again.");
          setLoading(false);
          return;
        }

        const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
        const paperById = new Map(papers.map((paper) => [paper.id, paper]));
        const examById = new Map(exams.map((exam) => [exam.id, exam]));
        const specializationById = new Map(specializations.map((item) => [item.id, item.name]));
        setQuestions((data ?? []).map((question) => {
          const subject = subjectById.get(question.subject_id);
          const paper = subject ? paperById.get(subject.paperId) : undefined;
          const exam = paper ? examById.get(paper.examId) : undefined;
          const paperName = paper ? `${paper.specializationId ? `${specializationById.get(paper.specializationId) ?? "Unknown Specialisation"} / ` : ""}${paper.name}` : "Unknown Paper";
          return {
            id: question.id,
            questionText: question.question_text,
            correctAnswer: question.correct_answer,
            isActive: question.is_active,
            contentLifecycle: question.content_lifecycle as QuestionLifecycle,
            reviewOn: question.review_on,
            expiresOn: question.expires_on,
            categoryId: exam?.categoryId ?? "",
            examId: exam?.id ?? "",
            specializationId: paper?.specializationId ?? "",
            paperId: paper?.id ?? "",
            subjectId: subject?.id ?? "",
            examName: exam?.name ?? "Unknown Exam",
            paperName,
            subjectName: subject?.name ?? "Unknown Subject",
          };
        }));
        setTotal(count ?? 0);
        setLoading(false);
      })();
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [exams, location.categoryId, page, papers, search, specializations, subjects, visibleSubjectIds]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const questionBankUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (location.categoryId) params.set("category", location.categoryId);
    if (location.examId) params.set("exam", location.examId);
    if (location.specializationId) params.set("specialization", location.specializationId);
    if (location.paperId) params.set("paper", location.paperId);
    if (location.subjectId) params.set("subject", location.subjectId);
    if (search.trim()) params.set("q", search.trim().slice(0, 100));
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `/admin/questions?${query}` : "/admin/questions";
  }, [location, page, search]);

  useEffect(() => {
    window.history.replaceState(window.history.state, "", questionBankUrl);
  }, [questionBankUrl]);

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
          onChange={(value) => { setLocation(value); setPage(1); }}
          includeSubjects
        />
        <label className="block max-w-xl text-sm font-bold">
          Search existing questions
          <input
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
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
      ) : loading ? (
        <p className="p-6 text-sm text-slate-600">Loading questionsâ€¦</p>
      ) : loadError ? (
        <p className="p-6 text-sm font-semibold text-red-700">{loadError}</p>
      ) : questions.length === 0 ? (
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
              {questions.map((question) => {
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
                          href={`/admin/questions/${question.id}/edit?returnTo=${encodeURIComponent(questionBankUrl)}`}
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
          {totalPages > 1 && <div className="flex items-center justify-center gap-3 border-t p-4"><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40">Previous</button><span className="text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40">Next</button></div>}
        </div>
      )}
    </section>
  );
}
