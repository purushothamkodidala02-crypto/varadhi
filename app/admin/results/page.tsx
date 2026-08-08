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

export default async function AdminResultsPage() {
  const supabase = await createClient();
  const [attemptsResult, mockTestsResult] = await Promise.all([
    supabase
      .from("test_attempts")
      .select("id, user_id, mock_test_id, submitted_at, score, total_marks, correct_answers, incorrect_answers, unanswered_questions")
      .order("submitted_at", { ascending: false }),
    supabase.from("mock_tests").select("id, title"),
  ]);

  const attempts = (attemptsResult.data ?? []) as Attempt[];
  const mockTestTitles = new Map(
    (mockTestsResult.data ?? []).map((mockTest) => [mockTest.id, mockTest.title])
  );
  const participants = new Set(attempts.map((attempt) => attempt.user_id)).size;
  const averageScore = attempts.length === 0 ? 0 : attempts.reduce((total, attempt) => total + (attempt.total_marks === 0 ? 0 : (attempt.score / attempt.total_marks) * 100), 0) / attempts.length;
  const averageAccuracy = attempts.length === 0 ? 0 : attempts.reduce((total, attempt) => { const answered = attempt.correct_answers + attempt.incorrect_answers; return total + (answered === 0 ? 0 : (attempt.correct_answers / answered) * 100); }, 0) / attempts.length;

  return (
    <main>
      <div><h1 className="text-3xl font-bold">Results</h1><p className="mt-2 text-gray-600">Monitor completed student attempts and overall performance.</p></div>

      {attemptsResult.error || mockTestsResult.error ? <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">Unable to load attempt results: {attemptsResult.error?.message ?? mockTestsResult.error?.message}</div> : <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Completed attempts</p><p className="mt-2 text-3xl font-bold">{attempts.length}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Participants</p><p className="mt-2 text-3xl font-bold">{participants}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Average score</p><p className="mt-2 text-3xl font-bold">{averageScore.toFixed(1)}%</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Average accuracy</p><p className="mt-2 text-3xl font-bold">{averageAccuracy.toFixed(1)}%</p></div></div>{attempts.length === 0 ? <section className="mt-8 rounded-xl border border-dashed p-8 text-center"><h2 className="text-lg font-semibold">No completed attempts yet</h2><p className="mt-2 text-sm text-gray-600">Results will appear here when students finish published Mock Tests.</p></section> : <section className="mt-8"><h2 className="text-xl font-semibold">Recent attempts</h2><div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left"><thead className="border-b bg-gray-50"><tr><th className="px-4 py-3 text-sm">Mock Test</th><th className="px-4 py-3 text-sm">Score</th><th className="px-4 py-3 text-sm">Correct</th><th className="px-4 py-3 text-sm">Unanswered</th><th className="px-4 py-3 text-sm">Submitted</th></tr></thead><tbody>{attempts.slice(0, 50).map((attempt) => <tr key={attempt.id} className="border-b last:border-b-0"><td className="px-4 py-3 font-medium">{mockTestTitles.get(attempt.mock_test_id) ?? "Mock Test"}</td><td className="px-4 py-3">{attempt.score} / {attempt.total_marks}</td><td className="px-4 py-3">{attempt.correct_answers}</td><td className="px-4 py-3">{attempt.unanswered_questions}</td><td className="px-4 py-3 text-sm text-gray-600">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(attempt.submitted_at))}</td></tr>)}</tbody></table></div></section>}</>}
    </main>
  );
}
