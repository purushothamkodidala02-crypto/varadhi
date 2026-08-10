import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/server";

export default async function MockTestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [testResult, assignmentsResult, authResult] = await Promise.all([
    supabase.from("mock_tests").select("id, paper_id, subject_id, test_scope, title, description, instructions, duration_minutes, status, access_type").eq("id", id).eq("status", "published").eq("access_type", "free").maybeSingle(),
    supabase.from("mock_test_questions").select("marks, negative_marks").eq("mock_test_id", id),
    supabase.auth.getUser(),
  ]);
  const test = testResult.data;
  if (!test) notFound();

  const [paperResult, subjectResult] = await Promise.all([
    supabase.from("papers").select("id, exam_group_id, specialization_id, name").eq("id", test.paper_id).maybeSingle(),
    test.subject_id ? supabase.from("subjects").select("id, name, content_language_mode").eq("id", test.subject_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const paper = paperResult.data;
  const [examResult, specializationResult] = await Promise.all([
    paper ? supabase.from("exam_groups").select("id, exam_id, name").eq("id", paper.exam_group_id).maybeSingle() : Promise.resolve({ data: null }),
    paper?.specialization_id ? supabase.from("exam_specializations").select("id, name").eq("id", paper.specialization_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const exam = examResult.data;
  const categoryResult = exam ? await supabase.from("exams").select("id, name").eq("id", exam.exam_id).maybeSingle() : { data: null };
  const assignments = assignmentsResult.data ?? [];
  const questionCount = assignments.length;
  const totalMarks = assignments.reduce((total, item) => total + Number(item.marks), 0);
  const negativeMarks = assignments.length ? Math.max(...assignments.map((item) => Number(item.negative_marks))) : 0;
  const languageMode = subjectResult.data?.content_language_mode ?? "bilingual";
  const languageLabel = languageMode === "bilingual" ? "English + Telugu" : languageMode === "telugu" ? "Telugu" : "English";
  const isLoggedIn = Boolean(authResult.data.user);
  const canStart = questionCount > 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/mock-tests" className="text-sm font-bold text-teal-700 hover:text-teal-800">← Back to mock tests</Link>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <section>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Free</span><span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">{test.test_scope === "paper" ? "Full-length Paper test" : "Subject test"}</span></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">{categoryResult.data?.name ?? "TGPSC"} · {exam?.name ?? "Exam"}</p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">{test.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{test.description ?? "A focused Varadhi mock test designed to strengthen your exam preparation."}</p>
            <div className="mt-7 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">{specializationResult.data && <span className="rounded-lg border bg-white px-3 py-2">{specializationResult.data.name}</span>}<span className="rounded-lg border bg-white px-3 py-2">{paper?.name ?? "Paper"}</span>{subjectResult.data && <span className="rounded-lg border bg-white px-3 py-2">{subjectResult.data.name}</span>}</div>

            <section className="mt-10 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black">Before you begin</h2><p className="mt-2 text-sm leading-6 text-slate-600">Review the test rules now. The timer starts only after you select the start button.</p><div className="mt-7 grid gap-4 sm:grid-cols-2">{[["Questions", String(questionCount)], ["Duration", `${test.duration_minutes} minutes`], ["Total marks", totalMarks.toFixed(2).replace(/\.00$/, "")], ["Negative marking", negativeMarks > 0 ? `Up to ${negativeMarks} per wrong answer` : "No negative marking"], ["Language", languageLabel], ["Progress", "Saved during the attempt"]].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 font-black text-slate-950">{value}</p></div>)}</div></section>

            <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black">Instructions</h2>{test.instructions ? <div className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">{test.instructions}</div> : <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700"><li className="flex gap-3"><span className="font-black text-teal-700">01</span>Answer each question before moving on, or return to it later during the attempt.</li><li className="flex gap-3"><span className="font-black text-teal-700">02</span>Your answers are saved as you progress. Avoid closing the browser while the test is active.</li><li className="flex gap-3"><span className="font-black text-teal-700">03</span>The test submits automatically when the timer reaches zero.</li><li className="flex gap-3"><span className="font-black text-teal-700">04</span>Review your score and answers from the student dashboard after submission.</li></ul>}</section>
          </section>

          <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:sticky lg:top-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-200">Ready to practise?</p><h2 className="mt-3 text-2xl font-black">Start when you are prepared.</h2><p className="mt-3 text-sm leading-6 text-slate-300">Once started, the test timer continues until submission or expiry.</p><div className="mt-6 space-y-3 border-y border-slate-700 py-5 text-sm"><p className="flex justify-between gap-3"><span className="text-slate-400">Questions</span><strong>{questionCount}</strong></p><p className="flex justify-between gap-3"><span className="text-slate-400">Duration</span><strong>{test.duration_minutes} min</strong></p><p className="flex justify-between gap-3"><span className="text-slate-400">Access</span><strong>Free</strong></p></div>{canStart ? <Link href={`/mock-tests/${id}/attempt`} className="mt-6 block rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200">{isLoggedIn ? "Start mock test" : "Sign in to start"}</Link> : <p className="mt-6 rounded-xl bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200">This test is not ready to start yet.</p>}<p className="mt-4 text-center text-xs leading-5 text-slate-400">Your attempt and results are stored securely in your account.</p></aside>
        </div>
      </div>
    </main>
  );
}
