import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FormattedQuestionText } from "@/components/questions/FormattedQuestionText";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/server";

type ReviewRow = {
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

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
                Detailed review
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Questions and explanations
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <Legend tone="emerald" label="Correct answer" />
              <Legend tone="red" label="Incorrect selection" />
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {rows.map((row) => {
              const options = [
                ["A", row.option_a],
                ["B", row.option_b],
                ["C", row.option_c],
                ["D", row.option_d],
              ] as const;
              return (
                <article
                  key={row.question_order}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-100 px-6 py-5 sm:px-7">
                    <div className="flex min-w-0 gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">
                        {row.question_order}
                      </span>
                      <FormattedQuestionText
                        text={row.question_text}
                        className="pt-1 leading-7 text-slate-950 sm:text-lg"
                      />
                    </div>
                    <QuestionStatus row={row} />
                  </div>

                  <div className="p-6 sm:p-7">
                    <div className="grid gap-3">
                      {options.map(([key, label]) => (
                        <OptionRow
                          key={key}
                          optionKey={key}
                          label={label}
                          correct={key === row.correct_answer}
                          selected={key === row.selected_answer}
                        />
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <p className="text-sm font-bold text-slate-700">
                        Marks awarded: {row.marks_awarded}
                      </p>
                      {!row.selected_answer && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          Not attempted
                        </span>
                      )}
                    </div>

                    {row.explanation && (
                      <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-5 text-sm leading-7 text-teal-950">
                        <p className="text-xs font-black uppercase tracking-wide text-teal-700">
                          Explanation
                        </p>
                        <p className="mt-2">{row.explanation}</p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

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

function QuestionStatus({ row }: { row: ReviewRow }) {
  const detail = row.is_correct
    ? ["Correct", "bg-emerald-100 text-emerald-800"]
    : row.selected_answer
      ? ["Incorrect", "bg-red-100 text-red-800"]
      : ["Unanswered", "bg-slate-100 text-slate-600"];
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${detail[1]}`}>
      {detail[0]}
    </span>
  );
}

function OptionRow({
  optionKey,
  label,
  correct,
  selected,
}: {
  optionKey: string;
  label: string;
  correct: boolean;
  selected: boolean;
}) {
  const style = correct
    ? "border-emerald-300 bg-emerald-50 text-emerald-950"
    : selected
      ? "border-red-300 bg-red-50 text-red-950"
      : "border-slate-200 bg-white text-slate-700";
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${style}`}>
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-black ${
          correct
            ? "bg-emerald-700 text-white"
            : selected
              ? "bg-red-700 text-white"
              : "bg-slate-100 text-slate-600"
        }`}
      >
        {optionKey}
      </span>
      <span className="pt-1 text-sm font-medium leading-6">{label}</span>
      <span className="ml-auto shrink-0 pt-1 text-[10px] font-black uppercase tracking-wide">
        {correct && selected
          ? "Your answer · Correct"
          : correct
            ? "Correct answer"
            : selected
              ? "Your answer"
              : ""}
      </span>
    </div>
  );
}

function Legend({ tone, label }: { tone: "emerald" | "red"; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full ${tone === "emerald" ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {label}
    </span>
  );
}
