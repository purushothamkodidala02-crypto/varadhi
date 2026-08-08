import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

export default async function AttemptReviewPage({ params }: PageProps<"/dashboard/attempts/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("get_attempt_review", { requested_attempt_id: id });
  const rows = (data ?? []) as ReviewRow[];
  if (error || rows.length === 0) notFound();

  const summary = rows[0];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black">← Back to Dashboard</Link>
      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Attempt review</p>
        <h1 className="mt-2 text-3xl font-bold">{summary.mock_test_title}</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-4"><div><p className="text-sm text-gray-500">Score</p><p className="text-2xl font-bold">{summary.score} / {summary.total_marks}</p></div><div><p className="text-sm text-gray-500">Correct</p><p className="text-2xl font-bold text-green-700">{summary.correct_answers}</p></div><div><p className="text-sm text-gray-500">Incorrect</p><p className="text-2xl font-bold text-red-700">{summary.incorrect_answers}</p></div><div><p className="text-sm text-gray-500">Unanswered</p><p className="text-2xl font-bold">{summary.unanswered_questions}</p></div></div>
      </section>

      <section className="mt-8 space-y-5">
        {rows.map((row) => {
          const options = [["A", row.option_a], ["B", row.option_b], ["C", row.option_c], ["D", row.option_d]];
          return <article key={row.question_order} className="rounded-xl border bg-white p-6"><div className="flex items-start justify-between gap-4"><h2 className="text-lg font-semibold">{row.question_order}. {row.question_text}</h2><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${row.is_correct ? "bg-green-100 text-green-700" : row.selected_answer ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{row.is_correct ? "Correct" : row.selected_answer ? "Incorrect" : "Unanswered"}</span></div><div className="mt-5 grid gap-2">{options.map(([key, label]) => <p key={key} className={`rounded-lg border px-4 py-3 text-sm ${key === row.correct_answer ? "border-green-300 bg-green-50" : key === row.selected_answer ? "border-red-300 bg-red-50" : ""}`}><span className="mr-2 font-semibold">{key}.</span>{label}{key === row.correct_answer && <span className="ml-3 text-xs font-semibold text-green-700">Correct answer</span>}{key === row.selected_answer && key !== row.correct_answer && <span className="ml-3 text-xs font-semibold text-red-700">Your answer</span>}</p>)}</div><p className="mt-4 text-sm font-medium">Marks awarded: {row.marks_awarded}</p>{row.explanation && <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700"><span className="font-semibold">Explanation: </span>{row.explanation}</div>}</article>;
        })}
      </section>
    </main>
  );
}
