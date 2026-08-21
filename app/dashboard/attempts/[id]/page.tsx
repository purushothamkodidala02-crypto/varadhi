import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/server";
import { AttemptReviewNavigator, type ReviewRow } from "./AttemptReviewNavigator";

type AttemptSummary = {
  mock_test_id: string;
  submitted_at: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_questions: number;
  detailed_review_available: boolean;
};

export default async function AttemptReviewPage({
  params,
}: PageProps<"/dashboard/attempts/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [attemptResult, reviewResult] = await Promise.all([
    supabase
      .from("test_attempts")
      .select("mock_test_id, submitted_at, score, total_marks, correct_answers, incorrect_answers, unanswered_questions, detailed_review_available")
      .eq("id", id)
      .maybeSingle(),
    supabase.rpc("get_attempt_review", { requested_attempt_id: id }),
  ]);
  const attempt = attemptResult.data as AttemptSummary | null;
  if (!attempt) notFound();
  if (!attempt.detailed_review_available) {
    const { data: mockTest } = await supabase.from("mock_tests").select("title").eq("id", attempt.mock_test_id).maybeSingle();
    return <ExpiredAttemptReview attempt={attempt} title={mockTest?.title ?? "Mock test"} />;
  }

  const { data, error } = reviewResult;
  const rows = (data ?? []) as ReviewRow[];
  if (error || rows.length === 0) notFound();

  const summary = rows[0];
  const percentage =
    summary.total_marks === 0
      ? 0
      : (summary.score / summary.total_marks) * 100;

  return (
    <main className="min-h-screen bg-[#f5f8f8]">
      <PublicHeader />
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800"
        >
          <span aria-hidden="true">←</span> Back to dashboard
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 sm:p-9">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-300/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-teal-200">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
                Attempt review
              </p>
              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                {summary.mock_test_title}
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Review every answer and use the explanations to plan your next
                practice session.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-white/5 px-6 py-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Final score
              </p>
              <p className="mt-2 text-4xl font-black">
                {summary.score}
                <span className="text-xl text-slate-400"> / {summary.total_marks}</span>
              </p>
              <p className="mt-2 text-sm font-bold text-teal-200">
                {percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryMetric
            label="Score"
            value={`${summary.score} / ${summary.total_marks}`}
            tone="teal"
          />
          <SummaryMetric
            label="Correct"
            value={String(summary.correct_answers)}
            tone="emerald"
          />
          <SummaryMetric
            label="Incorrect"
            value={String(summary.incorrect_answers)}
            tone="red"
          />
          <SummaryMetric
            label="Unanswered"
            value={String(summary.unanswered_questions)}
            tone="slate"
          />
        </section>

        <AttemptReviewNavigator rows={rows} />

        <section className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-teal-50 p-6 sm:p-8">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Ready for the next practice session?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose another mock test and apply what you learned here.
            </p>
          </div>
          <Link
            href="/mock-tests"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Browse mock tests
          </Link>
        </section>
      </div>
    </main>
  );
}

function ExpiredAttemptReview({ attempt, title }: { attempt: AttemptSummary; title: string }) {
  return (
    <main className="min-h-screen bg-[#f5f8f8]">
      <PublicHeader />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800">Back to dashboard</Link>
        <section className="mt-6 rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-200">Attempt summary</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 text-sm text-slate-300">Submitted {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(attempt.submitted_at))}</p>
        </section>
        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryMetric label="Score" value={`${attempt.score} / ${attempt.total_marks}`} tone="teal" />
          <SummaryMetric label="Correct" value={String(attempt.correct_answers)} tone="emerald" />
          <SummaryMetric label="Incorrect" value={String(attempt.incorrect_answers)} tone="red" />
          <SummaryMetric label="Unanswered" value={String(attempt.unanswered_questions)} tone="slate" />
        </section>
        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950 sm:p-8">
          <h2 className="text-xl font-black">Detailed answer review is no longer stored</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6">Your score and exam summary remain in your account permanently. Question-by-question answers are retained for 365 days or for your latest 100 attempts, whichever keeps them longer.</p>
        </section>
      </div>
    </main>
  );
}

const summaryStyles = {
  teal: "border-teal-100 bg-teal-50 text-teal-950",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-950",
  red: "border-red-100 bg-red-50 text-red-950",
  slate: "border-slate-200 bg-white text-slate-950",
};

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: keyof typeof summaryStyles;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${summaryStyles[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
