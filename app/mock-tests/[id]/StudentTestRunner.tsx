"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { saveAttemptProgress, submitAttempt, type SubmitAttemptResult } from "./attempt-actions";

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

type StudentTestRunnerProps = { title: string; sessionId: string; expiresAt: string; questions: TestQuestion[] };

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
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  useEffect(() => {
    if (submission || submitting) return;
    const saveDelay = window.setTimeout(() => { void saveAttemptProgress(sessionId, answers); }, 350);
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
    if (secondsRemaining === 0 && !submission && !submitting) void finishTest();
  }, [finishTest, secondsRemaining, submission, submitting]);

  if (submission) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10">
        <section className="w-full max-w-xl rounded-3xl border bg-white p-8 text-center shadow-xl shadow-slate-950/5 sm:p-10">
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${submission.success ? "text-emerald-700" : "text-red-700"}`}>{submission.success ? "Test submitted" : "Submission needs attention"}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
          {submission.success ? <><p className="mt-7 text-5xl font-black tracking-tight text-slate-950">{submission.score} <span className="text-2xl text-slate-400">/ {submission.totalMarks}</span></p><div className="mt-7 grid grid-cols-3 gap-3 text-left"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-700">Correct</p><p className="mt-1 text-xl font-black text-emerald-900">{submission.correctAnswers}</p></div><div className="rounded-xl bg-red-50 p-3"><p className="text-xs font-bold text-red-700">Incorrect</p><p className="mt-1 text-xl font-black text-red-900">{submission.incorrectAnswers}</p></div><div className="rounded-xl bg-slate-100 p-3"><p className="text-xs font-bold text-slate-600">Skipped</p><p className="mt-1 text-xl font-black text-slate-900">{submission.unansweredQuestions}</p></div></div><Link href="/dashboard" className="mt-8 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">View dashboard</Link></> : <><p className="mt-5 text-slate-600">{submission.message}</p><button type="button" onClick={() => setSubmission(null)} className="mt-7 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Try again</button></>}
        </section>
      </main>
    );
  }

  const options = [["A", question.option_a], ["B", question.option_b], ["C", question.option_c], ["D", question.option_d]] as const;
  const locked = secondsRemaining === 0 || submitting;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-300">{title}</p><h1 className="mt-1 text-2xl font-black tracking-tight">Question {currentIndex + 1} <span className="text-slate-400">of {questions.length}</span></h1></div><div className={`rounded-xl px-4 py-3 font-mono text-xl font-black ${secondsRemaining < 60 ? "bg-red-500 text-white" : "bg-white text-slate-950"}`}>{formatTime(secondsRemaining)}</div></div>
          <div className="mt-5 flex items-center gap-4"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-teal-300 transition-all" style={{ width: `${progress}%` }} /></div><span className="text-xs font-bold text-teal-100">{answeredCount}/{questions.length} answered</span></div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_13rem]">
          <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Multiple choice question</p>
            <p className="mt-4 text-lg font-bold leading-8 text-slate-950">{question.question_text}</p>
            {question.image_url && <img src={question.image_url} alt="Question reference" className="mt-6 max-h-80 rounded-xl border object-contain" />}
            <div className="mt-7 grid gap-3">
              {options.map(([key, label]) => {
                const selected = answers[question.question_id] === key;
                return <label key={key} className={`flex gap-4 rounded-2xl border p-4 transition ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-teal-300 hover:bg-teal-50/30"} ${selected ? "border-teal-600 bg-teal-50" : "border-slate-200 bg-white"}`}><input type="radio" name={question.question_id} value={key} disabled={locked} checked={selected} onChange={() => setAnswers((current) => ({ ...current, [question.question_id]: key }))} className="sr-only" /><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-black ${selected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>{key}</span><span className="pt-0.5 text-sm font-medium leading-6 text-slate-800">{label}</span></label>;
              })}
            </div>
          </section>

          <aside className="rounded-3xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Question map</p><div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-4">{questions.map((item, index) => <button key={item.question_id} type="button" disabled={locked} onClick={() => setCurrentIndex(index)} className={`grid aspect-square place-items-center rounded-lg text-xs font-black transition ${index === currentIndex ? "bg-slate-950 text-white" : answers[item.question_id] ? "bg-teal-100 text-teal-800 hover:bg-teal-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{index + 1}</button>)}</div><p className="mt-5 text-xs leading-5 text-slate-500">Teal questions are answered. Your progress is saved automatically.</p></aside>
        </div>

        {secondsRemaining === 0 && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">Time is up. Your saved answers are being submitted.</p>}
        <div className="mt-6 flex items-center justify-between gap-4"><button type="button" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0 || locked} className="rounded-xl border bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>{currentIndex === questions.length - 1 ? <button type="button" onClick={finishTest} disabled={locked} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Submitting…" : "Finish test"}</button> : <button type="button" onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} disabled={locked} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Next question</button>}</div>
      </div>
    </main>
  );
}
