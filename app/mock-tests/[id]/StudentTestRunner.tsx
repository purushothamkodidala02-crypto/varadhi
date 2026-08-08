"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  saveAttemptProgress,
  submitAttempt,
  type SubmitAttemptResult,
} from "./attempt-actions";

type TestQuestion = {
  question_id: string;
  question_order: number;
  marks: number;
  negative_marks: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  image_url: string | null;
  selected_answer: "A" | "B" | "C" | "D" | null;
};

type StudentTestRunnerProps = {
  title: string;
  sessionId: string;
  expiresAt: string;
  questions: TestQuestion[];
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getSecondsRemaining(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function StudentTestRunner({ title, sessionId, expiresAt, questions }: StudentTestRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>(() => Object.fromEntries(questions.flatMap((question) => question.selected_answer ? [[question.question_id, question.selected_answer]] : [])));
  const [secondsRemaining, setSecondsRemaining] = useState(() => getSecondsRemaining(expiresAt));
  const [submission, setSubmission] = useState<SubmitAttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (submission) return;
    const updateTime = () => setSecondsRemaining(getSecondsRemaining(expiresAt));
    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, submission]);

  const question = questions[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  useEffect(() => {
    if (submission || submitting) return;
    const saveDelay = window.setTimeout(() => {
      void saveAttemptProgress(sessionId, answers);
    }, 350);

    return () => window.clearTimeout(saveDelay);
  }, [answers, sessionId, submission, submitting]);

  const finishTest = useCallback(async () => {
    if (submitting || submission) return;
    setSubmitting(true);
    const result = await submitAttempt(sessionId, answers);
    setSubmission(result);
    setSubmitting(false);
  }, [answers, sessionId, submission, submitting]);

  useEffect(() => {
    if (secondsRemaining === 0 && !submission && !submitting) {
      void finishTest();
    }
  }, [finishTest, secondsRemaining, submission, submitting]);

  if (submission) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <section className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <p className={`text-sm font-semibold uppercase tracking-wide ${submission.success ? "text-green-700" : "text-red-700"}`}>{submission.success ? "Test completed" : "Unable to submit test"}</p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          {submission.success ? <><p className="mt-4 text-2xl font-bold">{submission.score} / {submission.totalMarks}</p><p className="mt-3 text-gray-600">{submission.correctAnswers} correct, {submission.incorrectAnswers} incorrect, {submission.unansweredQuestions} unanswered.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-black px-5 py-3 font-medium text-white">View Dashboard</Link></> : <><p className="mt-4 text-gray-600">{submission.message}</p><button type="button" onClick={() => setSubmission(null)} className="mt-6 rounded-lg bg-black px-5 py-3 font-medium text-white">Try Again</button></>}
        </section>
      </main>
    );
  }

  const options = [
    ["A", question.option_a],
    ["B", question.option_b],
    ["C", question.option_c],
    ["D", question.option_d],
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-3 rounded-xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm text-gray-500">{title}</p><h1 className="text-xl font-bold">Question {currentIndex + 1} of {questions.length}</h1></div>
          <p className="rounded-lg bg-gray-900 px-4 py-2 font-mono font-semibold text-white">{formatTime(secondsRemaining)}</p>
        </header>

        <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-lg font-medium leading-8">{question.question_text}</p>
          {question.image_url && <img src={question.image_url} alt="Question reference" className="mt-5 max-h-80 rounded-lg border object-contain" />}
          <div className="mt-6 grid gap-3">
            {options.map(([key, label]) => (
              <label key={key} className={`flex items-center gap-3 rounded-lg border p-4 ${secondsRemaining === 0 || submitting ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${answers[question.question_id] === key ? "border-gray-900 bg-gray-50" : "hover:bg-gray-50"}`}>
                <input type="radio" name={question.question_id} value={key} disabled={secondsRemaining === 0 || submitting} checked={answers[question.question_id] === key} onChange={() => setAnswers((current) => ({ ...current, [question.question_id]: key }))} />
                <span><span className="mr-2 font-semibold">{key}.</span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        {secondsRemaining === 0 && <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">Time is up. Submitting your saved answers.</p>}

        <div className="mt-6 flex items-center justify-between gap-4">
          <button type="button" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0 || secondsRemaining === 0 || submitting} className="rounded-lg border px-5 py-3 font-medium disabled:opacity-40">Previous</button>
          {currentIndex === questions.length - 1 ? <button type="button" onClick={finishTest} disabled={submitting || secondsRemaining === 0} className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50">{submitting ? "Submitting..." : "Finish Test"}</button> : <button type="button" onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} disabled={secondsRemaining === 0 || submitting} className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50">Next</button>}
        </div>
      </div>
    </main>
  );
}
