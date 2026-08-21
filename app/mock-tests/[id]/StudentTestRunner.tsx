"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { containsTeluguText, FormattedQuestionText } from "@/components/questions/FormattedQuestionText";
import { QuestionMedia } from "@/components/questions/QuestionMedia";
import { LoadingSpinner, LongPendingNotice, PendingButtonContent } from "@/components/feedback/LoadingSpinner";
import { pauseAttempt, resumeAttempt, saveAttemptProgress, saveReviewState, submitAttempt, syncAttemptTimer, type SubmitAttemptResult } from "./attempt-actions";

type Answer = "A" | "B" | "C" | "D";
type TestQuestion = {
  question_id: string; question_order: number; marks: number; negative_marks: number;
  question_text: string; option_a: string; option_b: string; option_c: string; option_d: string;
  image_url: string | null; selected_answer: Answer | null; marked_for_review: boolean;
  content_language_mode: "bilingual" | "english" | "telugu";
  question_text_te: string | null; option_a_te: string | null; option_b_te: string | null;
  option_c_te: string | null; option_d_te: string | null;
};
type Props = { mockTestId: string; publicTestPath: string; title: string; sessionId: string; expiresAt: string; questions: TestQuestion[] };

function secondsLeft(expiresAt: string) { return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)); }
function displayTime(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return hours ? `${String(hours).padStart(2, "0")}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function StudentTestRunner({ mockTestId, publicTestPath, title, sessionId, expiresAt, questions }: Props) {
  const [deadline, setDeadline] = useState(expiresAt);
  const [index, setIndex] = useState(() => {
    const lastAnsweredIndex = questions.reduce((last, question, questionIndex) => question.selected_answer ? questionIndex : last, -1);
    return lastAnsweredIndex >= 0 ? Math.min(lastAnsweredIndex + 1, questions.length - 1) : 0;
  });
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => Object.fromEntries(questions.flatMap((item) => item.selected_answer ? [[item.question_id, item.selected_answer]] : [])));
  const [reviewIds, setReviewIds] = useState<Set<string>>(
    () => new Set(questions.filter((item) => item.marked_for_review).map((item) => item.question_id)),
  );
  const [remaining, setRemaining] = useState<number | null>(null);
  const [language, setLanguage] = useState<"en" | "te">("en");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pauseError, setPauseError] = useState("");
  const [submission, setSubmission] = useState<SubmitAttemptResult | null>(null);
  const saveChains = useRef(new Map<string, Promise<void>>());

  const current = questions[index];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const unanswered = questions.length - answered;
  const locked = remaining === null || remaining === 0 || submitting || pausing || paused;
  const pauseControlDisabled = remaining === null || remaining === 0 || submitting || pausing;

  const queueSave = useCallback((key: string, operation: () => Promise<{ success: boolean }>) => {
    setSaveState("saving");
    const previous = saveChains.current.get(key) ?? Promise.resolve();
    const next = previous
      .then(operation)
      .then((result) => {
        if (!result.success) setSaveState("error");
      })
      .catch(() => setSaveState("error"))
      .then(() => {
        if (saveChains.current.get(key) === next) saveChains.current.delete(key);
        if (saveChains.current.size === 0) {
          setSaveState((current) => current === "error" ? current : "saved");
        }
      });
    saveChains.current.set(key, next);
  }, []);

  const flushSaves = useCallback(async () => {
    await Promise.all([...saveChains.current.values()]);
  }, []);

  const finish = useCallback(async () => {
    if (submitting || submission) return;
    setConfirming(false);
    setSubmitting(true);
    await flushSaves();
    setSubmission(await submitAttempt(sessionId, answers));
    setSubmitting(false);
  }, [answers, flushSaves, sessionId, submission, submitting]);

  useEffect(() => {
    if (submission || paused) return;
    const updateTimer = () => {
      const next = secondsLeft(deadline);
      setRemaining(next);
      if (next === 0 && !submitting) void finish();
    };
    updateTimer();
    const timer = window.setInterval(() => {
      updateTimer();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, finish, paused, submission, submitting]);

  useEffect(() => {
    if (submission || paused || pausing || submitting) return;
    const sync = async () => {
      const result = await syncAttemptTimer(sessionId);
      if (result.success && typeof result.remaining === "number") {
        setRemaining(result.remaining);
      }
    };
    const timer = window.setInterval(() => void sync(), 30000);
    return () => window.clearInterval(timer);
  }, [paused, pausing, sessionId, submission, submitting]);

  useEffect(() => {
    function navigateWithKeyboard(event: KeyboardEvent) {
      if (locked || confirming) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button, a, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((value) => Math.max(0, value - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((value) => Math.min(questions.length - 1, value + 1));
      }
    }
    window.addEventListener("keydown", navigateWithKeyboard);
    return () => window.removeEventListener("keydown", navigateWithKeyboard);
  }, [confirming, locked, questions.length]);

  if (submission) return <SubmissionResult publicTestPath={publicTestPath} title={title} result={submission} onRetry={() => setSubmission(null)} />;

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
    const marked = !reviewIds.has(current.question_id);
    setReviewIds((value) => {
      const next = new Set(value);
      if (marked) next.add(current.question_id); else next.delete(current.question_id);
      return next;
    });
    queueSave(
      `review:${current.question_id}`,
      () => saveReviewState(sessionId, current.question_id, marked),
    );
  }
  function clearAnswer() {
    setSaveState("saving");
    setAnswers((value) => { const next = { ...value }; delete next[current.question_id]; return next; });
    queueSave(
      `answer:${current.question_id}`,
      () => saveAttemptProgress(sessionId, current.question_id, null),
    );
  }
  async function togglePause() {
    if (pauseControlDisabled) return;
    setPauseError("");
    setPausing(true);
    await flushSaves();
    if (paused) {
      const result = await resumeAttempt(mockTestId, sessionId);
      if (result.success && result.expiresAt) {
        setDeadline(result.expiresAt);
        setPaused(false);
      } else {
        setPauseError(result.message);
      }
      setPausing(false);
      return;
    }
    const result = await pauseAttempt(sessionId, answers);
    if (result.success) {
      if (typeof result.remaining === "number") setRemaining(result.remaining);
      setPaused(true);
    } else {
      setPauseError(result.message);
    }
    setPausing(false);
  }

  const navigator = <QuestionNavigator questions={questions} currentIndex={index} answers={answers} reviewIds={reviewIds} locked={locked} onSelect={(next) => { setIndex(next); setNavigatorOpen(false); }} onFinish={() => setConfirming(true)} />;

  return <main className="min-h-screen bg-slate-100 pb-8">
    <header className="sticky top-0 z-20 border-b border-slate-700 bg-slate-950 px-4 py-2.5 text-white shadow-lg sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-400 sm:text-sm">{title}</p><h1 className="mt-0.5 text-base font-black sm:text-lg">Question {index + 1} <span className="text-slate-400">of {questions.length}</span></h1></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setNavigatorOpen(true)} className="rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-bold lg:hidden">Questions</button><PracticeTimerControl remaining={remaining} paused={paused} busy={pausing} disabled={pauseControlDisabled} onToggle={() => void togglePause()} /></div>
        </div>
        <div className="mt-2 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-teal-300 transition-all" style={{ width: `${Math.round((answered / questions.length) * 100)}%` }} /></div><span className={`text-[11px] font-bold ${saveState === "error" ? "text-red-300" : "text-teal-100"}`}>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Answers saved"}</span></div>
      </div>
    </header>

      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-8">
      {pauseError && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{pauseError}</p>}
      {paused && <p className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-800">Test paused. Your answers and remaining time are saved. Select Resume when you are ready.</p>}
      {navigatorOpen && <section className="mb-5 rounded-3xl border bg-white p-5 shadow-sm lg:hidden"><button type="button" onClick={() => setNavigatorOpen(false)} className="float-right text-xs font-bold text-slate-500">Close</button>{navigator}</section>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Multiple choice question</p><p className="mt-1 text-xs font-semibold text-slate-500">{current.marks} mark{Number(current.marks) === 1 ? "" : "s"}{Number(current.negative_marks) > 0 ? ` · −${current.negative_marks} for a wrong answer` : ""}</p></div>{bilingual && <div className="rounded-lg bg-slate-100 p-1 text-xs font-bold"><button type="button" onClick={() => setLanguage("en")} className={`rounded-md px-3 py-1.5 ${language === "en" ? "bg-white shadow-sm" : "text-slate-600"}`}>English</button><button type="button" onClick={() => setLanguage("te")} className={`rounded-md px-3 py-1.5 ${language === "te" ? "bg-white shadow-sm" : "text-slate-600"}`}>తెలుగు</button></div>}</div>
          <FormattedQuestionText text={questionText} className="mt-6 text-lg leading-8" />
          {current.image_url && <QuestionMedia src={current.image_url} className="mt-6" />}
          <div className="mt-7 grid gap-3">{options.map(([key, text]) => { const selected = answers[current.question_id] === key; const teluguOption = containsTeluguText(text); return <label key={key} className={`flex cursor-pointer gap-4 rounded-2xl border p-4 transition hover:border-teal-300 ${selected ? "border-teal-600 bg-teal-50" : "bg-white"} ${locked ? "pointer-events-none opacity-60" : ""}`}><input className="sr-only" type="radio" name={current.question_id} value={key} checked={selected} disabled={locked} onChange={() => { setSaveState("saving"); setAnswers((value) => ({ ...value, [current.question_id]: key })); queueSave(`answer:${current.question_id}`, () => saveAttemptProgress(sessionId, current.question_id, key)); }} /><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-black ${selected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>{key}</span><span lang={teluguOption ? "te" : undefined} className={`whitespace-pre-line pt-1 text-sm font-medium leading-6 text-slate-800 ${teluguOption ? "font-telugu" : ""}`}>{text}</span></label>; })}</div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5"><button type="button" onClick={clearAnswer} disabled={!answers[current.question_id] || locked} className="text-sm font-bold text-slate-500 hover:text-red-700 disabled:opacity-40">Clear answer</button><button type="button" onClick={toggleReview} disabled={locked} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${reviewIds.has(current.question_id) ? "bg-amber-100 text-amber-900" : "border text-slate-700"}`}>{reviewIds.has(current.question_id) ? "Marked for review" : "Mark for review"}</button></div>
        </section>
        <aside className="hidden h-[calc(100vh-7rem)] min-h-0 overflow-hidden rounded-3xl border bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block">{navigator}</aside>
      </div>
      {remaining === 0 && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Time is up. Your saved answers are being submitted.</p>}
      <div className="mt-6 flex justify-between gap-3"><button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0 || locked} className="rounded-xl border bg-white px-5 py-3 text-sm font-bold disabled:opacity-40">Previous</button>{index === questions.length - 1 ? <button type="button" onClick={() => setConfirming(true)} disabled={locked} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Review & finish</button> : <button type="button" onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))} disabled={locked} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Save & next</button>}</div>
    </div>

    {confirming && <SubmissionDialog answered={answered} review={reviewIds.size} unanswered={unanswered} submitting={submitting} onCancel={() => setConfirming(false)} onSubmit={() => void finish()} />}
  </main>;
}

function QuestionNavigator({ questions, currentIndex, answers, reviewIds, locked, onSelect, onFinish }: { questions: TestQuestion[]; currentIndex: number; answers: Record<string, Answer>; reviewIds: Set<string>; locked: boolean; onSelect: (index: number) => void; onFinish: () => void }) {
  const answeredCount = Object.keys(answers).length;
  const remainingCount = questions.length - answeredCount;

  return (
    <div className="flex min-h-0 flex-col lg:h-full">
      <div className="shrink-0 bg-white">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Question navigator
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <NavigatorMetric value={answeredCount} label="Answered" tone="text-emerald-800" />
          <NavigatorMetric value={reviewIds.size} label="Review" tone="text-amber-800" />
          <NavigatorMetric value={remainingCount} label="Remaining" tone="text-slate-700" />
        </div>
      </div>

      <div className="mt-4 max-h-[45vh] min-h-0 overflow-y-auto overscroll-contain pr-1 lg:max-h-none lg:flex-1">
        <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
          {questions.map((item, index) => {
            const marked = reviewIds.has(item.question_id);
            const answered = Boolean(answers[item.question_id]);
            return (
              <button
                key={item.question_id}
                type="button"
                disabled={locked}
                onClick={() => onSelect(index)}
                className={`grid aspect-square place-items-center rounded-lg text-xs font-black ${index === currentIndex ? "bg-slate-950 text-white ring-2 ring-teal-300 ring-offset-2" : marked ? "bg-amber-100 text-amber-900" : answered ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 shrink-0 border-t pt-4">
        <div className="space-y-2 text-xs text-slate-600">
          <Legend color="bg-emerald-100" label="Answered" />
          <Legend color="bg-amber-100" label="Marked for review" />
          <Legend color="bg-slate-100" label="Not answered" />
        </div>
        <button type="button" onClick={onFinish} disabled={locked} className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-50">
          Finish test
        </button>
      </div>
    </div>
  );
}

function SubmissionDialog({ answered, review, unanswered, submitting, onCancel, onSubmit }: { answered: number; review: number; unanswered: number; submitting: boolean; onCancel: () => void; onSubmit: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-5" role="dialog" aria-modal="true" aria-busy={submitting}><section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Final submission</p><h2 className="mt-2 text-2xl font-black">Finish this mock test?</h2><p className="mt-3 text-sm text-slate-600">You cannot change your answers after submission.</p><div className="mt-6 grid grid-cols-3 gap-3"><Metric value={answered} label="Answered" tone="text-emerald-800" /><Metric value={review} label="Review" tone="text-amber-800" /><Metric value={unanswered} label="Unanswered" tone="text-slate-700" /></div>{unanswered > 0 && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">You still have {unanswered} unanswered question{unanswered === 1 ? "" : "s"}.</p>}<div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onCancel} disabled={submitting} className="rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-50">Continue test</button><button type="button" onClick={onSubmit} disabled={submitting} aria-busy={submitting} className="min-w-36 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70"><PendingButtonContent pending={submitting} pendingLabel="Submitting…">Submit test</PendingButtonContent></button></div><LongPendingNotice pending={submitting} /></section></div>;
}

function SubmissionResult({ publicTestPath, title, result, onRetry }: { publicTestPath: string; title: string; result: SubmitAttemptResult; onRetry: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10"><section className="w-full max-w-2xl rounded-3xl border bg-white p-8 text-center shadow-xl sm:p-10"><p className={`text-xs font-bold uppercase tracking-[0.16em] ${result.success ? "text-emerald-700" : "text-red-700"}`}>{result.success ? "Test submitted" : "Submission needs attention"}</p><h1 className="mt-3 text-3xl font-black">{title}</h1>{result.success ? <><p className="mt-7 text-5xl font-black">{result.score} <span className="text-2xl text-slate-400">/ {result.totalMarks}</span></p><div className="mt-7 grid grid-cols-3 gap-3"><Metric value={result.correctAnswers ?? 0} label="Correct" tone="text-emerald-800" /><Metric value={result.incorrectAnswers ?? 0} label="Incorrect" tone="text-red-800" /><Metric value={result.unansweredQuestions ?? 0} label="Unanswered" tone="text-slate-700" /></div><div className="mt-8 flex flex-wrap justify-center gap-3">{result.attemptId && <Link href={`/dashboard/attempts/${result.attemptId}`} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Review answers</Link>}<Link href={publicTestPath} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white">Retake test</Link><Link href="/dashboard" className="rounded-xl border px-5 py-3 text-sm font-bold">Go to dashboard</Link></div></> : <><p className="mt-5 text-slate-600">{result.message}</p><button type="button" onClick={onRetry} className="mt-7 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Try submission again</button></>}</section></main>;
}

function Metric({ value, label, tone }: { value: number; label: string; tone: string }) { return <div className="rounded-xl border bg-white px-3 py-3 text-center"><strong className={`block text-lg font-black ${tone}`}>{value}</strong><span className="text-xs font-semibold text-slate-500">{label}</span></div>; }
function NavigatorMetric({ value, label, tone }: { value: number; label: string; tone: string }) { return <div className="rounded-xl bg-slate-50 px-2 py-2.5 text-center"><strong className={`block text-base font-black ${tone}`}>{value}</strong><span className="mt-0.5 block text-[10px] font-bold text-slate-500">{label}</span></div>; }
function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${color}`} />{label}</span>; }

function PracticeTimerControl({ remaining, paused, busy, disabled, onToggle }: { remaining: number | null; paused: boolean; busy: boolean; disabled: boolean; onToggle: () => void }) {
  const urgent = remaining !== null && remaining <= 300 && !paused;
  return (
    <div className={`flex items-stretch rounded-2xl border p-1 shadow-inner transition ${paused ? "border-teal-400/60 bg-teal-300/10" : urgent ? "border-red-400/50 bg-red-500/10" : "border-slate-700 bg-slate-900"}`}>
      <button type="button" onClick={onToggle} disabled={disabled} aria-label={paused ? "Resume test timer" : "Pause test timer"} title={paused ? "Resume timer" : "Pause timer"} className={`inline-flex min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${paused ? "bg-teal-300 text-slate-950 hover:bg-teal-200" : "text-white hover:bg-slate-800"}`}>
        {busy ? <LoadingSpinner className="h-4 w-4" /> : paused ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M8 5.2v13.6c0 .9 1 1.4 1.7.9l9.1-6.8a1.1 1.1 0 0 0 0-1.8L9.7 4.3A1.1 1.1 0 0 0 8 5.2Z" /></svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current"><rect x="6" y="5" width="4.5" height="14" rx="1.2" /><rect x="13.5" y="5" width="4.5" height="14" rx="1.2" /></svg>
        )}
        <span className="hidden sm:inline">{busy ? (paused ? "Resuming" : "Pausing") : paused ? "Resume" : "Pause"}</span>
      </button>
      <div className="ml-1 min-w-[5.8rem] border-l border-slate-700/80 px-3 py-1 text-right">
        <span className={`block text-[9px] font-black uppercase tracking-[0.14em] ${paused ? "text-teal-200" : urgent ? "text-red-200" : "text-slate-400"}`}>{paused ? "Paused" : "Time left"}</span>
        <strong className={`mt-0.5 block font-mono text-lg leading-none ${urgent ? "text-red-300" : "text-white"}`}>{remaining === null ? "--:--" : displayTime(remaining)}</strong>
      </div>
    </div>
  );
}
