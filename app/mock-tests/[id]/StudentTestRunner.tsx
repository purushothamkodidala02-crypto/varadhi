"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { containsTeluguText, FormattedQuestionText } from "@/components/questions/FormattedQuestionText";
import { saveAttemptProgress, submitAttempt, type SubmitAttemptResult } from "./attempt-actions";

type Answer = "A" | "B" | "C" | "D";
type TestQuestion = {
  question_id: string; question_order: number; marks: number; negative_marks: number;
  question_text: string; option_a: string; option_b: string; option_c: string; option_d: string;
  image_url: string | null; selected_answer: Answer | null;
  content_language_mode: "bilingual" | "english" | "telugu";
  question_text_te: string | null; option_a_te: string | null; option_b_te: string | null;
  option_c_te: string | null; option_d_te: string | null;
};
type Props = { title: string; sessionId: string; expiresAt: string; questions: TestQuestion[] };

function secondsLeft(expiresAt: string) { return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)); }
function displayTime(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return hours ? `${String(hours).padStart(2, "0")}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function StudentTestRunner({ title, sessionId, expiresAt, questions }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => Object.fromEntries(questions.flatMap((item) => item.selected_answer ? [[item.question_id, item.selected_answer]] : [])));
  const [reviewIds, setReviewIds] = useState<Set<string>>(() => new Set());
  const [remaining, setRemaining] = useState<number | null>(null);
  const [language, setLanguage] = useState<"en" | "te">("en");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<SubmitAttemptResult | null>(null);

  const current = questions[index];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const unanswered = questions.length - answered;
  const locked = remaining === null || remaining === 0 || submitting;

  useEffect(() => {
    if (submission || submitting) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      const result = await saveAttemptProgress(sessionId, answers);
      if (active) setSaveState(result.success ? "saved" : "error");
    }, 450);
    return () => { active = false; window.clearTimeout(timer); };
  }, [answers, sessionId, submission, submitting]);

  useEffect(() => {
    if (submission) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submission]);

  const finish = useCallback(async () => {
    if (submitting || submission) return;
    setConfirming(false);
    setSubmitting(true);
    setSubmission(await submitAttempt(sessionId, answers));
    setSubmitting(false);
  }, [answers, sessionId, submission, submitting]);

  useEffect(() => {
    if (submission) return;
    const updateTimer = () => {
      const next = secondsLeft(expiresAt);
      setRemaining(next);
      if (next === 0 && !submitting) void finish();
    };
    updateTimer();
    const timer = window.setInterval(() => {
      updateTimer();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, finish, submission, submitting]);

  if (submission) return <SubmissionResult title={title} result={submission} onRetry={() => setSubmission(null)} />;

  const bilingual = current.content_language_mode === "bilingual" && Boolean(current.question_text_te);
  const telugu = bilingual && language === "te";
  const questionText = telugu ? current.question_text_te ?? current.question_text : current.question_text;
  const options = [
    ["A", telugu ? current.option_a_te ?? current.option_a : current.option_a],
    ["B", telugu ? current.option_b_te ?? current.option_b : current.option_b],
    ["C", telugu ? current.option_c_te ?? current.option_c : current.option_c],
    ["D", telugu ? current.option_d_te ?? current.option_d : current.option_d],
  ] as const;

  function toggleReview() {
    setReviewIds((value) => { const next = new Set(value); if (next.has(current.question_id)) next.delete(current.question_id); else next.add(current.question_id); return next; });
  }
  function clearAnswer() {
    setSaveState("saving");
    setAnswers((value) => { const next = { ...value }; delete next[current.question_id]; return next; });
  }

  const navigator = <QuestionNavigator questions={questions} currentIndex={index} answers={answers} reviewIds={reviewIds} locked={locked} onSelect={(next) => { setIndex(next); setNavigatorOpen(false); }} onFinish={() => setConfirming(true)} />;

  return <main className="min-h-screen bg-slate-100 pb-8">
    <header className="sticky top-0 z-20 border-b border-slate-700 bg-slate-950 px-4 py-4 text-white shadow-lg sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-300">{title}</p><h1 className="mt-1 text-lg font-black">Question {index + 1} <span className="text-slate-400">of {questions.length}</span></h1></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setNavigatorOpen(true)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold lg:hidden">Questions</button><div className={`rounded-xl px-4 py-2.5 font-mono text-lg font-black ${remaining !== null && remaining <= 300 ? "bg-red-500" : "bg-white text-slate-950"}`}>{remaining === null ? "--:--" : displayTime(remaining)}</div></div>
        </div>
        <div className="mt-4 flex items-center gap-4"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-teal-300 transition-all" style={{ width: `${Math.round((answered / questions.length) * 100)}%` }} /></div><span className={`text-xs font-bold ${saveState === "error" ? "text-red-300" : "text-teal-100"}`}>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Answers saved"}</span></div>
      </div>
    </header>

    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8">
      <div className="mb-4 grid max-w-md grid-cols-3 gap-2"><Metric value={answered} label="Answered" tone="text-emerald-800" /><Metric value={reviewIds.size} label="Review" tone="text-amber-800" /><Metric value={unanswered} label="Remaining" tone="text-slate-700" /></div>
      {navigatorOpen && <section className="mb-5 rounded-3xl border bg-white p-5 shadow-sm lg:hidden"><button type="button" onClick={() => setNavigatorOpen(false)} className="float-right text-xs font-bold text-slate-500">Close</button>{navigator}</section>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Multiple choice question</p><p className="mt-1 text-xs font-semibold text-slate-500">{current.marks} mark{Number(current.marks) === 1 ? "" : "s"}{Number(current.negative_marks) > 0 ? ` · −${current.negative_marks} for a wrong answer` : ""}</p></div>{bilingual && <div className="rounded-lg bg-slate-100 p-1 text-xs font-bold"><button type="button" onClick={() => setLanguage("en")} className={`rounded-md px-3 py-1.5 ${language === "en" ? "bg-white shadow-sm" : "text-slate-600"}`}>English</button><button type="button" onClick={() => setLanguage("te")} className={`rounded-md px-3 py-1.5 ${language === "te" ? "bg-white shadow-sm" : "text-slate-600"}`}>తెలుగు</button></div>}</div>
          <FormattedQuestionText text={questionText} className="mt-6 text-lg leading-8" />
          {current.image_url && <img src={current.image_url} alt="Question reference" className="mt-6 max-h-80 rounded-xl border object-contain" />}
          <div className="mt-7 grid gap-3">{options.map(([key, text]) => { const selected = answers[current.question_id] === key; const teluguOption = containsTeluguText(text); return <label key={key} className={`flex cursor-pointer gap-4 rounded-2xl border p-4 transition hover:border-teal-300 ${selected ? "border-teal-600 bg-teal-50" : "bg-white"} ${locked ? "pointer-events-none opacity-60" : ""}`}><input className="sr-only" type="radio" name={current.question_id} value={key} checked={selected} disabled={locked} onChange={() => { setSaveState("saving"); setAnswers((value) => ({ ...value, [current.question_id]: key })); }} /><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-black ${selected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>{key}</span><span lang={teluguOption ? "te" : undefined} className={`whitespace-pre-line pt-1 text-sm font-medium leading-6 text-slate-800 ${teluguOption ? "font-telugu" : ""}`}>{text}</span></label>; })}</div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5"><button type="button" onClick={clearAnswer} disabled={!answers[current.question_id] || locked} className="text-sm font-bold text-slate-500 hover:text-red-700 disabled:opacity-40">Clear answer</button><button type="button" onClick={toggleReview} disabled={locked} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${reviewIds.has(current.question_id) ? "bg-amber-100 text-amber-900" : "border text-slate-700"}`}>{reviewIds.has(current.question_id) ? "Marked for review" : "Mark for review"}</button></div>
        </section>
        <aside className="hidden max-h-[calc(100vh-9rem)] overflow-y-auto rounded-3xl border bg-white p-5 shadow-sm lg:sticky lg:top-32 lg:block">{navigator}</aside>
      </div>
      {remaining === 0 && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Time is up. Your saved answers are being submitted.</p>}
      <div className="mt-6 flex justify-between gap-3"><button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0 || locked} className="rounded-xl border bg-white px-5 py-3 text-sm font-bold disabled:opacity-40">Previous</button>{index === questions.length - 1 ? <button type="button" onClick={() => setConfirming(true)} disabled={locked} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Review & finish</button> : <button type="button" onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))} disabled={locked} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Save & next</button>}</div>
    </div>

    {confirming && <SubmissionDialog answered={answered} review={reviewIds.size} unanswered={unanswered} submitting={submitting} onCancel={() => setConfirming(false)} onSubmit={() => void finish()} />}
  </main>;
}

function QuestionNavigator({ questions, currentIndex, answers, reviewIds, locked, onSelect, onFinish }: { questions: TestQuestion[]; currentIndex: number; answers: Record<string, Answer>; reviewIds: Set<string>; locked: boolean; onSelect: (index: number) => void; onFinish: () => void }) {
  return <><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Question navigator</p><div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-4">{questions.map((item, index) => { const marked = reviewIds.has(item.question_id); const answered = Boolean(answers[item.question_id]); return <button key={item.question_id} type="button" disabled={locked} onClick={() => onSelect(index)} className={`grid aspect-square place-items-center rounded-lg text-xs font-black ${index === currentIndex ? "bg-slate-950 text-white ring-2 ring-teal-300 ring-offset-2" : marked ? "bg-amber-100 text-amber-900" : answered ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{index + 1}</button>; })}</div><div className="mt-5 space-y-2 text-xs text-slate-600"><Legend color="bg-emerald-100" label="Answered" /><Legend color="bg-amber-100" label="Marked for review" /><Legend color="bg-slate-100" label="Not answered" /></div><button type="button" onClick={onFinish} disabled={locked} className="mt-6 w-full rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-50">Finish test</button></>;
}

function SubmissionDialog({ answered, review, unanswered, submitting, onCancel, onSubmit }: { answered: number; review: number; unanswered: number; submitting: boolean; onCancel: () => void; onSubmit: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-5" role="dialog" aria-modal="true"><section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Final submission</p><h2 className="mt-2 text-2xl font-black">Finish this mock test?</h2><p className="mt-3 text-sm text-slate-600">You cannot change your answers after submission.</p><div className="mt-6 grid grid-cols-3 gap-3"><Metric value={answered} label="Answered" tone="text-emerald-800" /><Metric value={review} label="Review" tone="text-amber-800" /><Metric value={unanswered} label="Unanswered" tone="text-slate-700" /></div>{unanswered > 0 && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">You still have {unanswered} unanswered question{unanswered === 1 ? "" : "s"}.</p>}<div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-xl border px-4 py-3 text-sm font-bold">Continue test</button><button type="button" onClick={onSubmit} disabled={submitting} className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Submitting…" : "Submit test"}</button></div></section></div>;
}

function SubmissionResult({ title, result, onRetry }: { title: string; result: SubmitAttemptResult; onRetry: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10"><section className="w-full max-w-2xl rounded-3xl border bg-white p-8 text-center shadow-xl sm:p-10"><p className={`text-xs font-bold uppercase tracking-[0.16em] ${result.success ? "text-emerald-700" : "text-red-700"}`}>{result.success ? "Test submitted" : "Submission needs attention"}</p><h1 className="mt-3 text-3xl font-black">{title}</h1>{result.success ? <><p className="mt-7 text-5xl font-black">{result.score} <span className="text-2xl text-slate-400">/ {result.totalMarks}</span></p><div className="mt-7 grid grid-cols-3 gap-3"><Metric value={result.correctAnswers ?? 0} label="Correct" tone="text-emerald-800" /><Metric value={result.incorrectAnswers ?? 0} label="Incorrect" tone="text-red-800" /><Metric value={result.unansweredQuestions ?? 0} label="Unanswered" tone="text-slate-700" /></div><div className="mt-8 flex flex-wrap justify-center gap-3">{result.attemptId && <Link href={`/dashboard/attempts/${result.attemptId}`} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Review answers</Link>}<Link href="/dashboard" className="rounded-xl border px-5 py-3 text-sm font-bold">Go to dashboard</Link></div></> : <><p className="mt-5 text-slate-600">{result.message}</p><button type="button" onClick={onRetry} className="mt-7 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Try submission again</button></>}</section></main>;
}

function Metric({ value, label, tone }: { value: number; label: string; tone: string }) { return <div className="rounded-xl border bg-white px-3 py-3 text-center"><strong className={`block text-lg font-black ${tone}`}>{value}</strong><span className="text-xs font-semibold text-slate-500">{label}</span></div>; }
function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${color}`} />{label}</span>; }
