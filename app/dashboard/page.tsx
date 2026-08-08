import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/server";

type Attempt = { id: string; mock_test_id: string; submitted_at: string; score: number; total_marks: number; correct_answers: number; incorrect_answers: number; unanswered_questions: number };
type AvailableMockTest = { id: string; title: string; duration_minutes: number; access_type: "free" | "paid"; price_inr: number | null };
type SubjectAnalytics = { subject_name: string; answered_questions: number; correct_answers: number; accuracy: number; net_marks: number };

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [attemptsResult, subjectAnalyticsResult, availableTestsResult, allTestsResult] = await Promise.all([
    supabase.from("test_attempts").select("id, mock_test_id, submitted_at, score, total_marks, correct_answers, incorrect_answers, unanswered_questions").order("submitted_at", { ascending: false }),
    supabase.rpc("get_student_subject_analytics"),
    supabase.from("mock_tests").select("id, title, duration_minutes, access_type, price_inr").eq("status", "published").order("display_order", { ascending: true }),
    supabase.from("mock_tests").select("id, title"),
  ]);

  const attempts = (attemptsResult.data ?? []) as Attempt[];
  const subjectAnalytics = (subjectAnalyticsResult.data ?? []) as SubjectAnalytics[];
  const availableTests = (availableTestsResult.data ?? []) as AvailableMockTest[];
  const testTitles = new Map((allTestsResult.data ?? []).map((test) => [test.id, test.title]));
  const averageScore = attempts.length === 0 ? 0 : attempts.reduce((total, attempt) => total + (attempt.total_marks === 0 ? 0 : (attempt.score / attempt.total_marks) * 100), 0) / attempts.length;
  const metrics = [
    ["Completed attempts", attempts.length, "All submitted tests"],
    ["Average score", `${averageScore.toFixed(1)}%`, "Across all attempts"],
    ["Latest score", attempts[0] ? `${attempts[0].score} / ${attempts[0].total_marks}` : "—", attempts[0] ? testTitles.get(attempts[0].mock_test_id) ?? "Mock test" : "No attempts yet"],
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-950/10 sm:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">Student dashboard</p><h1 className="mt-2 text-3xl font-black tracking-tight">Keep your preparation moving.</h1><p className="mt-2 text-sm text-slate-300">Review progress, then choose the next mock test.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/mock-tests" className="rounded-xl bg-teal-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-teal-200">Find tests</Link><div className="min-w-24"><LogoutButton /></div></div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {metrics.map(([label, value, detail]) => <article key={label as string} className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></article>)}
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Available now</p><h2 className="mt-2 text-2xl font-black text-slate-950">Choose your next practice test</h2></div><Link href="/mock-tests" className="text-sm font-bold text-teal-700 hover:text-teal-800">View all tests →</Link></div>
          {availableTests.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-600">No mock tests are available right now.</div> : <div className="mt-5 grid gap-4 md:grid-cols-2">{availableTests.slice(0, 4).map((test) => <article key={test.id} className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold text-slate-950">{test.title}</h3><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${test.access_type === "paid" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{test.access_type === "paid" ? `₹${test.price_inr}` : "Free"}</span></div><div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm font-semibold text-slate-600">{test.duration_minutes} minutes</span><Link href={`/mock-tests/${test.id}`} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">{test.access_type === "paid" ? "View access" : "Start test"}</Link></div></article>)}</div>}
        </section>

        {attempts.length === 0 ? <section className="mt-8 rounded-3xl border border-dashed bg-white p-10 text-center shadow-sm"><h2 className="text-2xl font-black text-slate-950">Your progress will appear here</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">Finish your first mock test to see recent scores and subject accuracy.</p><Link href="/mock-tests" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Browse mock tests</Link></section> : <>
          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-slate-950">Score trend</h2><p className="mt-1 text-sm text-slate-600">Your five latest attempts.</p><div className="mt-6 space-y-5">{attempts.slice(0, 5).map((attempt) => { const percentage = attempt.total_marks === 0 ? 0 : Math.max(0, Math.min(100, (attempt.score / attempt.total_marks) * 100)); return <div key={attempt.id}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="truncate font-semibold text-slate-700">{testTitles.get(attempt.mock_test_id) ?? "Mock test"}</span><span className="font-black text-slate-950">{percentage.toFixed(0)}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${percentage}%` }} /></div></div>; })}</div></div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-slate-950">Subject accuracy</h2><p className="mt-1 text-sm text-slate-600">Based on answered questions.</p>{subjectAnalytics.length === 0 ? <p className="mt-6 text-sm text-slate-600">Answer questions to unlock subject analytics.</p> : <div className="mt-6 space-y-5">{subjectAnalytics.map((subject) => <div key={subject.subject_name}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="font-semibold text-slate-700">{subject.subject_name}</span><span className="font-black text-slate-950">{Number(subject.accuracy).toFixed(1)}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, Number(subject.accuracy)))}%` }} /></div><p className="mt-2 text-xs text-slate-500">{subject.correct_answers} correct out of {subject.answered_questions} answered</p></div>)}</div>}</div>
          </section>
          <section className="mt-8"><h2 className="text-2xl font-black text-slate-950">Recent attempts</h2><div className="mt-5 overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="min-w-[720px] w-full text-left"><thead className="border-b bg-slate-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-5 py-4">Mock test</th><th className="px-5 py-4">Score</th><th className="px-5 py-4">Correct</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4 text-right">Review</th></tr></thead><tbody className="divide-y divide-slate-100">{attempts.map((attempt) => <tr key={attempt.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-bold text-slate-900">{testTitles.get(attempt.mock_test_id) ?? "Mock test"}</td><td className="px-5 py-4 font-semibold">{attempt.score} / {attempt.total_marks}</td><td className="px-5 py-4">{attempt.correct_answers}</td><td className="px-5 py-4 text-sm text-slate-600">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(attempt.submitted_at))}</td><td className="px-5 py-4 text-right"><Link href={`/dashboard/attempts/${attempt.id}`} className="rounded-lg px-3 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50">View review</Link></td></tr>)}</tbody></table></div></section>
        </>}
      </div>
    </main>
  );
}
