import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/server";
import { AttemptReviewNavigator, type ReviewRow } from "./AttemptReviewNavigator";

export default async function AttemptReviewPage({
  params,
}: PageProps<"/dashboard/attempts/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data, error } = await supabase.rpc("get_attempt_review", {
    requested_attempt_id: id,
  });
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
