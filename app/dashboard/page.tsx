import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/LogoutButton";

type Attempt = {
  id: string;
  mock_test_id: string;
  submitted_at: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_questions: number;
};

type AvailableMockTest = {
  id: string;
  title: string;
  duration_minutes: number;
  access_type: "free" | "paid";
  price_inr: number | null;
};

type SubjectAnalytics = {
  subject_name: string;
  answered_questions: number;
  correct_answers: number;
  accuracy: number;
  net_marks: number;
};

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [attemptsResult, subjectAnalyticsResult, availableTestsResult, allTestsResult] = await Promise.all([
    supabase
    .from("test_attempts")
    .select("id, mock_test_id, submitted_at, score, total_marks, correct_answers, incorrect_answers, unanswered_questions")
    .order("submitted_at", { ascending: false }),
    supabase.rpc("get_student_subject_analytics"),
    supabase.from("mock_tests").select("id, title, duration_minutes, access_type, price_inr").eq("status", "published").order("display_order", { ascending: true }),
    supabase.from("mock_tests").select("id, title"),
  ]);

  const attempts = (attemptsResult.data ?? []) as Attempt[];
  const subjectAnalytics = (subjectAnalyticsResult.data ?? []) as SubjectAnalytics[];
  const availableTests = (availableTestsResult.data ?? []) as AvailableMockTest[];
  const testTitles = new Map((allTestsResult.data ?? []).map((test) => [test.id, test.title]));
  const averageScore = attempts.length === 0 ? 0 : attempts.reduce((total, attempt) => total + (attempt.total_marks === 0 ? 0 : (attempt.score / attempt.total_marks) * 100), 0) / attempts.length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6"><div><h1 className="text-3xl font-bold">Your Dashboard</h1><p className="mt-2 text-gray-600">Track your completed mock-test attempts.</p></div><div className="flex items-center gap-3"><Link href="/mock-tests" className="rounded-lg border px-4 py-2 text-sm font-medium">Mock Tests</Link><div className="w-28"><LogoutButton /></div></div></header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Attempts</p><p className="mt-2 text-3xl font-bold">{attempts.length}</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Average score</p><p className="mt-2 text-3xl font-bold">{averageScore.toFixed(1)}%</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Latest score</p><p className="mt-2 text-3xl font-bold">{attempts[0] ? `${attempts[0].score} / ${attempts[0].total_marks}` : "—"}</p></div>
      </div>

      <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold">Available Mock Tests</h2><p className="mt-1 text-sm text-gray-600">Choose a published test and start practicing.</p></div><Link href="/mock-tests" className="text-sm font-semibold hover:underline">View all →</Link></div>{availableTests.length === 0 ? <div className="mt-4 rounded-xl border border-dashed p-6 text-sm text-gray-600">No Mock Tests are available right now.</div> : <div className="mt-4 grid gap-4 md:grid-cols-2">{availableTests.slice(0, 4).map((test) => <article key={test.id} className="rounded-xl border bg-white p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{test.title}</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${test.access_type === "paid" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>{test.access_type === "paid" ? `₹${test.price_inr}` : "Free"}</span></div><div className="mt-5 flex items-center justify-between"><span className="text-sm text-gray-600">{test.duration_minutes} minutes</span><Link href={`/mock-tests/${test.id}`} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">{test.access_type === "paid" ? "View Access" : "Start Test"}</Link></div></article>)}</div>}</section>

      {attempts.length > 0 && <section className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold">Score trend</h2><p className="mt-1 text-sm text-gray-600">Your latest attempts, newest first.</p><div className="mt-6 space-y-4">{attempts.slice(0, 5).map((attempt) => { const percentage = attempt.total_marks === 0 ? 0 : Math.max(0, Math.min(100, (attempt.score / attempt.total_marks) * 100)); return <div key={attempt.id}><div className="mb-1 flex justify-between gap-4 text-sm"><span className="truncate">{testTitles.get(attempt.mock_test_id) ?? "Mock Test"}</span><span className="font-medium">{percentage.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-gray-900" style={{ width: `${percentage}%` }} /></div></div>; })}</div></div><div className="rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold">Subject accuracy</h2><p className="mt-1 text-sm text-gray-600">Based on answered questions across all attempts.</p>{subjectAnalytics.length === 0 ? <p className="mt-6 text-sm text-gray-600">Answer questions to unlock subject analytics.</p> : <div className="mt-6 space-y-4">{subjectAnalytics.map((subject) => <div key={subject.subject_name}><div className="mb-1 flex justify-between gap-4 text-sm"><span>{subject.subject_name}</span><span className="font-medium">{Number(subject.accuracy).toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-green-600" style={{ width: `${Math.max(0, Math.min(100, Number(subject.accuracy)))}%` }} /></div><p className="mt-1 text-xs text-gray-500">{subject.correct_answers} correct out of {subject.answered_questions} answered</p></div>)}</div>}</div></section>}

      {attempts.length === 0 ? <section className="mt-8 rounded-xl border border-dashed p-8 text-center"><h2 className="text-lg font-semibold">No attempts yet</h2><p className="mt-2 text-sm text-gray-600">Complete a Mock Test to see your results here.</p><Link href="/mock-tests" className="mt-5 inline-flex rounded-lg bg-black px-5 py-3 font-medium text-white">Browse Mock Tests</Link></section> : <section className="mt-8"><h2 className="text-xl font-semibold">Recent attempts</h2><div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left"><thead className="border-b bg-gray-50"><tr><th className="px-4 py-3 text-sm">Mock Test</th><th className="px-4 py-3 text-sm">Score</th><th className="px-4 py-3 text-sm">Correct</th><th className="px-4 py-3 text-sm">Submitted</th><th className="px-4 py-3 text-sm">Review</th></tr></thead><tbody>{attempts.map((attempt) => <tr key={attempt.id} className="border-b last:border-b-0"><td className="px-4 py-3 font-medium">{testTitles.get(attempt.mock_test_id) ?? "Mock Test"}</td><td className="px-4 py-3">{attempt.score} / {attempt.total_marks}</td><td className="px-4 py-3">{attempt.correct_answers}</td><td className="px-4 py-3 text-sm text-gray-600">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(attempt.submitted_at))}</td><td className="px-4 py-3"><Link href={`/dashboard/attempts/${attempt.id}`} className="text-sm font-medium text-gray-700 hover:underline">View</Link></td></tr>)}</tbody></table></div></section>}
    </main>
  );
}
