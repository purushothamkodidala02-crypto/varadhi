"use client";

import { useEffect, useRef, useState } from "react";
import { FormattedQuestionText } from "@/components/questions/FormattedQuestionText";

export type ReviewRow = {
  mock_test_title: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_questions: number;
  question_order: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  marks_awarded: number;
  explanation: string | null;
};

export function AttemptReviewNavigator({ rows }: { rows: ReviewRow[] }) {
  const [index, setIndex] = useState(0);
  const questionRef = useRef<HTMLElement>(null);
  const activeNumberRef = useRef<HTMLButtonElement>(null);
  const row = rows[index];

  function showQuestion(nextIndex: number, scrollToCard = true) {
    const safeIndex = Math.max(0, Math.min(rows.length - 1, nextIndex));
    setIndex(safeIndex);
    if (scrollToCard) {
      requestAnimationFrame(() => questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  useEffect(() => {
    activeNumberRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) return;
      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        setIndex(index - 1);
        requestAnimationFrame(() => questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
      if (event.key === "ArrowRight" && index < rows.length - 1) {
        event.preventDefault();
        setIndex(index + 1);
        requestAnimationFrame(() => questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, rows.length]);

  const options = [
    ["A", row.option_a],
    ["B", row.option_b],
    ["C", row.option_c],
    ["D", row.option_d],
  ] as const;

  return (
    <section className="mt-8 sm:mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Detailed review</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Questions and explanations</h2>
          <p className="mt-2 text-sm text-slate-600">Review one question at a time. On a laptop, use the left and right arrow keys.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <Legend tone="emerald" label="Correct answer" />
          <Legend tone="red" label="Incorrect selection" />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Review question navigator">
          {rows.map((item, questionIndex) => {
            const active = questionIndex === index;
            const tone = item.is_correct
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : item.selected_answer
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-slate-200 bg-slate-100 text-slate-600";
            return (
              <button
                ref={active ? activeNumberRef : undefined}
                key={item.question_order}
                type="button"
                onClick={() => showQuestion(questionIndex)}
                aria-current={active ? "step" : undefined}
                aria-label={`Review question ${item.question_order}`}
                className={`grid h-11 min-w-11 shrink-0 place-items-center rounded-xl border text-sm font-black transition ${active ? "border-slate-950 bg-slate-950 text-white ring-2 ring-teal-300 ring-offset-2" : tone}`}
              >
                {item.question_order}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-4 sm:px-14">
        <div className="mb-3 flex items-center justify-between sm:hidden">
          <ReviewArrow direction="previous" disabled={index === 0} onClick={() => showQuestion(index - 1)} />
          <p className="text-sm font-bold text-slate-600">Question {index + 1} of {rows.length}</p>
          <ReviewArrow direction="next" disabled={index === rows.length - 1} onClick={() => showQuestion(index + 1)} />
        </div>
        <ReviewArrow direction="previous" disabled={index === 0} onClick={() => showQuestion(index - 1)} className="absolute left-0 top-1/2 hidden -translate-y-1/2 sm:grid" />
        <ReviewArrow direction="next" disabled={index === rows.length - 1} onClick={() => showQuestion(index + 1)} className="absolute right-0 top-1/2 hidden -translate-y-1/2 sm:grid" />

        <article ref={questionRef} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">{row.question_order}</span>
            <FormattedQuestionText text={row.question_text} className="pt-1 leading-7 text-slate-950 sm:text-lg" />
          </div>
          <QuestionStatus row={row} />
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid gap-3">
            {options.map(([key, label]) => <OptionRow key={key} optionKey={key} label={label} correct={key === row.correct_answer} selected={key === row.selected_answer} />)}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-sm font-bold text-slate-700">Marks awarded: {row.marks_awarded}</p>
            {!row.selected_answer && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Not attempted</span>}
          </div>
          {row.explanation && <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-5 text-sm leading-7 text-teal-950"><p className="text-xs font-black uppercase tracking-wide text-teal-700">Explanation</p><p className="mt-2">{row.explanation}</p></div>}
        </div>
        </article>
      </div>
    </section>
  );
}

function QuestionStatus({ row }: { row: ReviewRow }) {
  const detail = row.is_correct ? ["Correct", "bg-emerald-100 text-emerald-800"] : row.selected_answer ? ["Incorrect", "bg-red-100 text-red-800"] : ["Unanswered", "bg-slate-100 text-slate-600"];
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${detail[1]}`}>{detail[0]}</span>;
}

function OptionRow({ optionKey, label, correct, selected }: { optionKey: string; label: string; correct: boolean; selected: boolean }) {
  const style = correct ? "border-emerald-300 bg-emerald-50 text-emerald-950" : selected ? "border-red-300 bg-red-50 text-red-950" : "border-slate-200 bg-white text-slate-700";
  return <div className={`flex flex-wrap items-start gap-3 rounded-xl border p-3.5 sm:rounded-2xl sm:p-4 ${style}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-black ${correct ? "bg-emerald-700 text-white" : selected ? "bg-red-700 text-white" : "bg-slate-100 text-slate-600"}`}>{optionKey}</span><span className="min-w-0 flex-1 pt-1 text-sm font-medium leading-6">{label}</span><span className="w-full pl-11 text-[10px] font-black uppercase tracking-wide sm:ml-auto sm:w-auto sm:shrink-0 sm:pl-0 sm:pt-1">{correct && selected ? "Your answer · Correct" : correct ? "Correct answer" : selected ? "Your answer" : ""}</span></div>;
}

function ReviewArrow({ direction, disabled, onClick, className = "" }: { direction: "previous" | "next"; disabled: boolean; onClick: () => void; className?: string }) {
  const previous = direction === "previous";
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={previous ? "Previous question" : "Next question"} title={previous ? "Previous question" : "Next question"} className={`grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 ${className}`}><svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 fill-none stroke-current stroke-2 ${previous ? "" : "rotate-180"}`}><path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg></button>;
}

function Legend({ tone, label }: { tone: "emerald" | "red"; label: string }) {
  return <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm"><span className={`h-2.5 w-2.5 rounded-full ${tone === "emerald" ? "bg-emerald-500" : "bg-red-500"}`} />{label}</span>;
}
