import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Attempt = {
  id: string;
  user_id: string;
  mock_test_id: string;
  submitted_at: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_questions: number;
};

type AttemptSummary = { completed_attempts: number; participants: number; average_score: number; average_accuracy: number };

export default async function AdminResultsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const pageSize = 50;
  const supabase = await createClient();
  const [attemptsResult, mockTestsResult, summaryResult] = await Promise.all([
    supabase
      .from("test_attempts")
      .select("id, user_id, mock_test_id, submitted_at, score, total_marks, correct_answers, incorrect_answers, unanswered_questions", { count: "exact" })
      .order("submitted_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1),
    supabase.from("mock_tests").select("id, title"),
    supabase.rpc("get_admin_attempt_summary"),
  ]);

  const attempts = (attemptsResult.data ?? []) as Attempt[];
  const mockTestTitles = new Map(
    (mockTestsResult.data ?? []).map((mockTest) => [mockTest.id, mockTest.title])
  );
  const summary = (summaryResult.data?.[0] ?? { completed_attempts: 0, participants: 0, average_score: 0, average_accuracy: 0 }) as AttemptSummary;
  const totalPages = Math.max(1, Math.ceil((attemptsResult.count ?? 0) / pageSize));
  if (!attemptsResult.error && page > totalPages) {
    redirect(totalPages === 1 ? "/admin/results" : `/admin/results?page=${totalPages}`);
  }

  return (
    <main>
      <div><h1 className="text-3xl font-bold">Results</h1><p className="mt-2 text-gray-600">Monitor completed student attempts and overall performance.</p></div>

      {attemptsResult.error || mockTestsResult.error || summaryResult.error ? <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">Unable to load attempt results right now.</div> : <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Completed attempts</p><p className="mt-2 text-3xl font-bold">{Number(summary.completed_attempts)}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Participants</p><p className="mt-2 text-3xl font-bold">{Number(summary.participants)}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Average score</p><p className="mt-2 text-3xl font-bold">{Number(summary.average_score).toFixed(1)}%</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Average accuracy</p><p className="mt-2 text-3xl font-bold">{Number(summary.average_accuracy).toFixed(1)}%</p></div></div>{attempts.length === 0 ? <section className="mt-8 rounded-xl border border-dashed p-8 text-center"><h2 className="text-lg font-semibold">No completed attempts yet</h2><p className="mt-2 text-sm text-gray-600">Results will appear here when students finish published Mock Tests.</p></section> : <section className="mt-8"><h2 className="text-xl font-semibold">Recent attempts</h2><div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left"><thead className="border-b bg-gray-50"><tr><th className="px-4 py-3 text-sm">Mock Test</th><th className="px-4 py-3 text-sm">Score</th><th className="px-4 py-3 text-sm">Correct</th><th className="px-4 py-3 text-sm">Unanswered</th><th className="px-4 py-3 text-sm">Submitted</th></tr></thead><tbody>{attempts.map((attempt) => <tr key={attempt.id} className="border-b last:border-b-0"><td className="px-4 py-3 font-medium">{mockTestTitles.get(attempt.mock_test_id) ?? "Mock Test"}</td><td className="px-4 py-3">{attempt.score} / {attempt.total_marks}</td><td className="px-4 py-3">{attempt.correct_answers}</td><td className="px-4 py-3">{attempt.unanswered_questions}</td><td className="px-4 py-3 text-sm text-gray-600">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(attempt.submitted_at))}</td></tr>)}</tbody></table>{totalPages > 1 && <nav className="flex items-center justify-center gap-3 border-t p-4"><Link href={page > 2 ? `/admin/results?page=${page - 1}` : "/admin/results"} aria-disabled={page === 1} className={`rounded-lg border px-3 py-2 text-sm font-bold ${page === 1 ? "pointer-events-none opacity-40" : ""}`}>Previous</Link><span className="text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span><Link href={`/admin/results?page=${Math.min(totalPages, page + 1)}`} aria-disabled={page === totalPages} className={`rounded-lg border px-3 py-2 text-sm font-bold ${page === totalPages ? "pointer-events-none opacity-40" : ""}`}>Next</Link></nav>}</div></section>}</>}
    </main>
  );
}
