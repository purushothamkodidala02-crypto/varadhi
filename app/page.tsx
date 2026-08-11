import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand/VaradhiBrand";
import { ExamSymbol, MockSymbol, StateSymbol } from "@/components/exams/CatalogSymbols";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicHeader } from "@/components/site/PublicHeader";
import { absoluteUrl, SITE_DESCRIPTION } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "TG & AP State Exam Mock Tests | Varadhi Prep",
  description:
    "Find Telangana and Andhra Pradesh state exam mock tests by exam and paper. Practise in English and Telugu with clear test series and detailed review.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TG & AP State Exam Mock Tests | Varadhi Prep",
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
  },
};

const benefits = [
  { icon: "target", title: "Find the exact paper", description: "State, exam and paper are separated so unrelated tests never distract you." },
  { icon: "timer", title: "Practise at your pace", description: "Pause and resume practice while your answers and remaining time stay safely saved." },
  { icon: "review", title: "Learn after every test", description: "Review answers, explanations, scores and subject accuracy after submission." },
];

export default async function Home() {
  const supabase = await createClient();
  const [statesResult, categoriesResult, examsResult, papersResult, testsResult] = await Promise.all([
    supabase.from("exam_states").select("id, name, code, slug, description, display_order").eq("is_active", true).order("display_order"),
    supabase.from("exams").select("id, state_id, name").eq("is_active", true).order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name").eq("is_active", true).order("display_order"),
    supabase.from("papers").select("id, exam_group_id").eq("is_active", true),
    supabase.from("mock_tests").select("id, paper_id").eq("status", "published").eq("access_type", "free"),
  ]);
  const states = statesResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const exams = examsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const tests = testsResult.data ?? [];
  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const paperById = new Map(papers.map((item) => [item.id, item]));
  const testCountByExam = new Map<string, number>();
  for (const test of tests) {
    const examId = paperById.get(test.paper_id)?.exam_group_id;
    if (examId) testCountByExam.set(examId, (testCountByExam.get(examId) ?? 0) + 1);
  }
  const activeExams = exams.filter((exam) => (testCountByExam.get(exam.id) ?? 0) > 0);
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Varadhi Prep",
    alternateName: "Varadhi Prep Smart Mock Tests",
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: ["en-IN", "te-IN"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/mock-tests")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <JsonLd data={websiteJsonLd} />
      <PublicHeader />

      <section className="border-b bg-[#f4f7f8]">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Start with what matters</p>
              <h1 className="font-display mt-3 max-w-3xl text-4xl leading-[1.08] tracking-tight sm:text-5xl">Choose your state. We&apos;ll show only the right exams.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Telangana, Andhra Pradesh and Central exam catalogues stay separate from the first click.</p>
            </div>
            <Link href="/mock-tests" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm hover:border-teal-300">Browse complete catalogue <span aria-hidden="true">→</span></Link>
          </div>

          {statesResult.error ? (
            <div className="mt-8 rounded-3xl border border-dashed bg-white p-8 text-center text-sm text-slate-600">The new state catalogue will appear after its database update is applied.</div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {states.map((state, index) => {
                const stateCategoryIds = new Set(categories.filter((category) => category.state_id === state.id).map((category) => category.id));
                const stateExams = activeExams.filter((exam) => stateCategoryIds.has(exam.exam_id));
                const stateTests = stateExams.reduce((total, exam) => total + (testCountByExam.get(exam.id) ?? 0), 0);
                const color = index === 0 ? "bg-teal-50 text-teal-800" : index === 1 ? "bg-amber-50 text-amber-800" : "bg-indigo-50 text-indigo-800";
                return <Link key={state.id} href={`/mock-tests?state=${state.slug}`} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-slate-950/5">
                  <div className="flex items-start justify-between"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}><StateSymbol slug={state.slug} /></span><span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{state.code}</span></div>
                  <h2 className="font-display mt-5 text-2xl">{state.name}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{state.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm"><span className="font-semibold text-slate-500">{stateExams.length} exams · {stateTests} tests</span><span className="font-black text-teal-800 transition group-hover:translate-x-1">Explore →</span></div>
                </Link>;
              })}
            </div>
          )}

          {states.length > 0 && activeExams.length > 0 && <div className="mt-12"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Popular exam collections</p><h2 className="font-display mt-2 text-2xl">Continue directly to an exam</h2></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{activeExams.slice(0, 8).map((exam) => {
            const category = categoryById.get(exam.exam_id);
            const state = states.find((item) => item.id === category?.state_id);
            const paperCount = papers.filter((paper) => paper.exam_group_id === exam.id).length;
            return <Link key={exam.id} href={`/mock-tests?state=${state?.slug ?? ""}&exam=${exam.id}`} className="group rounded-2xl border bg-white p-5 transition hover:border-teal-300 hover:shadow-lg"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><ExamSymbol name={exam.name} className="h-5 w-5" /></span><span className="text-[10px] font-black uppercase tracking-wide text-teal-700">{state?.code} · {category?.name}</span></div><h3 className="font-display mt-4 leading-6">{exam.name}</h3><p className="mt-2 text-xs font-semibold text-slate-500">{paperCount} papers · {testCountByExam.get(exam.id)} tests</p></Link>;
          })}</div></div>}
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute -right-24 top-8 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal-200"><MockSymbol className="h-4 w-4" /> English + Telugu practice</p>
            <h2 className="font-display mt-6 text-4xl leading-[1.08] tracking-tight sm:text-6xl">Practise with purpose. Improve with every mock test.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Take focused tests in a clean exam workspace, pause when needed, and turn every result into a better study plan.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/mock-tests" className="rounded-xl bg-teal-300 px-5 py-3.5 font-black text-slate-950 hover:bg-teal-200">Start a mock test</Link><Link href="/register" className="rounded-xl border border-slate-700 px-5 py-3.5 font-black text-white hover:bg-white/5">Create free account</Link></div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-300">{["Clear test series", "Saved progress", "Detailed review"].map((item) => <span key={item} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-teal-300 text-[10px] font-black text-slate-950">✓</span>{item}</span>)}</div>
          </div>
          <TestPreview />
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">A focused workflow</p><h2 className="font-display mt-3 text-3xl tracking-tight sm:text-4xl">Everything needed for serious practice. Nothing extra.</h2></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">{benefits.map((benefit, index) => <article key={benefit.title} className="rounded-3xl border border-slate-200 p-6 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-sm font-black text-teal-800">0{index + 1}</span><h3 className="font-display mt-6 text-xl">{benefit.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{benefit.description}</p></article>)}</div>
      </section>

      <footer className="border-t bg-slate-950 text-slate-300"><div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div className="flex items-center gap-3"><BrandMark className="h-10 w-10" /><div><p className="font-display text-white">Varadhi Prep</p><p className="text-xs">Smart mock tests for career growth</p></div></div><div className="flex gap-5 text-sm font-semibold"><Link href="/mock-tests" className="hover:text-white">Mock tests</Link><Link href="/login" className="hover:text-white">Student login</Link><Link href="/admin" className="hover:text-white">Admin</Link></div></div></footer>
    </main>
  );
}

function TestPreview() {
  return <aside className="relative rounded-[2rem] border border-slate-700 bg-slate-900/80 p-4 shadow-2xl shadow-black/30 sm:p-6"><div className="flex items-center justify-between border-b border-slate-700 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-teal-200">Practice workspace</p><p className="font-display mt-1">TG · Executive Officer · Paper 1</p></div><span className="rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm font-bold text-teal-200">01:29:42</span></div><div className="mt-5 rounded-2xl bg-white p-5 text-slate-950 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wide text-teal-700">Question 12 of 100</p><span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold">English · తెలుగు</span></div><p className="mt-5 font-bold leading-7">Choose the option that best answers this practice question.</p><div className="mt-5 space-y-2.5">{["Option A", "Option B", "Option C", "Option D"].map((option, index) => <div key={option} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${index === 1 ? "border-teal-500 bg-teal-50 text-teal-900" : "text-slate-600"}`}><span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black ${index === 1 ? "bg-teal-700 text-white" : "bg-slate-100"}`}>{String.fromCharCode(65 + index)}</span>{option}</div>)}</div><div className="mt-6 flex justify-end border-t pt-5"><span className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-black text-white">Save & next</span></div></div></aside>;
}
