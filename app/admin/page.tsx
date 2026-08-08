import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [examsResult, mockTestsResult, questionsResult] = await Promise.all([
    supabase.from("exams").select("id", { count: "exact", head: true }),
    supabase.from("mock_tests").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
  ]);
  const metrics: Array<{ label: string; value: number; href: string; detail: string }> = [
    { label: "Exam categories", value: examsResult.count ?? 0, href: "/admin/exams", detail: "Set up categories such as TGPSC" },
    { label: "Mock tests", value: mockTestsResult.count ?? 0, href: "/admin/mock-tests", detail: "Create and publish practice tests" },
    { label: "Questions", value: questionsResult.count ?? 0, href: "/admin/questions", detail: "Grow your reusable question bank" },
  ];

  return (
    <div>
      <section className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-950/10 sm:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-200">Welcome to Varadhi</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Build a better mock-test experience.</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">Create the exam structure first: category, exam, paper, and subjects. Then add questions and publish mock tests.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/questions" className="rounded-xl bg-teal-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-teal-200">Add a question</Link>
          <Link href="/admin/mock-tests" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-white hover:bg-slate-900">Manage mock tests</Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
            <p className="text-sm font-bold text-slate-500">{metric.label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{metric.value}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">{metric.detail}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Fast content workflow</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Add exam structure", "Create an exam category, then its exams and subjects."],
            ["2", "Write questions", "Choose the subject, enter four options, and mark the right answer."],
            ["3", "Publish a mock test", "Assign questions to a mock test and change its status when ready."],
          ].map(([step, title, description]) => <div key={step} className="rounded-xl bg-slate-50 p-5"><span className="text-sm font-black text-teal-700">STEP {step}</span><h3 className="mt-2 font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>)}
        </div>
      </section>
    </div>
  );
}
