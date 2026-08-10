import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicHeader } from "@/components/site/PublicHeader";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { absoluteUrl, SITE_DESCRIPTION } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

type PublishedTest = {
  id: string;
  paper_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  test_scope: "paper" | "subject";
};

const benefits = [
  { number: "01", title: "Practise the right syllabus", description: "Choose the Exam, Paper, or Subject that matches your TGPSC preparation plan." },
  { number: "02", title: "Experience real test pressure", description: "Build confidence with timed attempts, negative marking, and safely saved answers." },
  { number: "03", title: "Learn from every attempt", description: "Review answers, explanations, scores, and Subject accuracy after completing a test." },
];

export const metadata: Metadata = {
  title: "Free TGPSC Mock Tests in English & Telugu | Varadhi",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Free TGPSC Mock Tests in English & Telugu | Varadhi",
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Free TGPSC Mock Tests in English & Telugu | Varadhi",
    description: SITE_DESCRIPTION,
  },
};

export default async function Home() {
  const supabase = await createClient();
  const [testsResult, papersResult] = await Promise.all([
    supabase
      .from("mock_tests")
      .select("id, paper_id, title, description, duration_minutes, test_scope")
      .eq("status", "published")
      .eq("access_type", "free")
      .order("display_order")
      .limit(3),
    supabase
      .from("papers")
      .select("id, exam_group_id, specialization_id, name, display_order")
      .eq("is_active", true),
  ]);
  const publishedTests = (testsResult.data ?? []) as PublishedTest[];
  const paperDisplayById = buildPaperDisplayMap(
    (papersResult.data ?? []) as OrderedPaper[],
  );
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Varadhi",
    alternateName: "Varadhi Exam Practice",
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: ["en-IN", "te-IN"],
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <JsonLd data={websiteJsonLd} />
      <PublicHeader />

      {publishedTests.length > 0 && <section className="border-b bg-slate-50"><div className="mx-auto max-w-6xl px-5 py-14 sm:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Available mock tests</p><h1 className="mt-2 text-3xl font-black tracking-tight">Choose a TGPSC mock test and start practising</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">See the exam, Paper number, duration, and syllabus focus first. Practise in English or Telugu and review the full details before starting.</p></div><Link href="/mock-tests" className="text-sm font-bold text-teal-700 hover:text-teal-800">View all mock tests →</Link></div><div className="mt-7 grid gap-4 lg:grid-cols-3">{publishedTests.map((test) => { const paperDisplay = paperDisplayById.get(test.paper_id); return <article key={test.id} className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Free</span><span className="text-xs font-bold text-slate-500">{test.test_scope === "paper" ? "Full-length" : "Subject test"}</span></div><p className="mt-5 flex items-start gap-2 text-xs font-bold uppercase tracking-[0.1em] text-teal-700"><span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-lg bg-teal-50 px-1 text-[10px] font-black">P{paperDisplay?.number ?? ""}</span><span className="min-w-0 pt-1 leading-5">{paperDisplay?.label ?? "Paper"}</span></p><h2 className="mt-3 text-lg font-black">{test.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{test.description ?? "Focused practice designed for serious exam preparation."}</p><div className="mt-6 flex items-center justify-between border-t pt-4"><span className="text-sm font-semibold text-slate-500">{test.duration_minutes} minutes</span><Link href={`/mock-tests/${test.id}`} className="text-sm font-bold text-teal-700">View test →</Link></div></article>; })}</div></div></section>}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/60 to-transparent" />
        <div className="absolute -right-32 top-16 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
              Built for Telangana aspirants
            </p>
            <h2 className="mt-7 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl">
              Practise with purpose. Improve with every mock test.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Take focused mock tests, practise in a real exam-style environment, and turn every result into a clearer study plan.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/mock-tests" className="rounded-xl bg-teal-300 px-5 py-3.5 font-bold text-slate-950 shadow-lg shadow-teal-300/10 transition hover:bg-teal-200">
                Start a free mock test
              </Link>
              <Link href="/register" className="rounded-xl border border-slate-700 px-5 py-3.5 font-bold text-white transition hover:border-slate-500 hover:bg-slate-900">
                Create free account
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-300">
              {["English + Telugu", "Timed attempts", "Detailed review"].map((item) => <span key={item} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-teal-300/15 text-xs text-teal-200">✓</span>{item}</span>)}
            </div>
          </div>

          <aside className="relative rounded-[2rem] border border-slate-700 bg-slate-900/80 p-4 shadow-2xl shadow-black/30 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-200">Live test experience</p><p className="mt-1 font-bold">Paper I · General Studies</p></div>
              <span className="rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm font-bold text-teal-200">01:29:42</span>
            </div>
            <div className="mt-5 rounded-2xl bg-white p-5 text-slate-950 sm:p-6">
              <div className="flex items-center justify-between gap-4"><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Question 12</p><div className="rounded-lg bg-slate-100 p-1 text-xs font-bold"><span className="inline-block rounded-md bg-white px-2.5 py-1 shadow-sm">English</span><span className="inline-block px-2.5 py-1 text-slate-500">తెలుగు</span></div></div>
              <p className="mt-5 font-bold leading-7">Which option best completes the statement shown in this practice question?</p>
              <div className="mt-5 space-y-2.5">{["Option A", "Option B", "Option C", "Option D"].map((option, index) => <div key={option} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${index === 1 ? "border-teal-500 bg-teal-50 text-teal-900" : "text-slate-600"}`}><span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black ${index === 1 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>{String.fromCharCode(65 + index)}</span>{option}</div>)}</div>
              <div className="mt-6 flex items-center justify-between border-t pt-5"><button className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600">Previous</button><button className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Save & next</button></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold"><div className="rounded-xl bg-emerald-400/10 px-2 py-3 text-emerald-200"><strong className="block text-base text-white">8</strong>Answered</div><div className="rounded-xl bg-amber-400/10 px-2 py-3 text-amber-200"><strong className="block text-base text-white">2</strong>Review</div><div className="rounded-xl bg-white/5 px-2 py-3 text-slate-300"><strong className="block text-base text-white">90</strong>Remaining</div></div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Purposeful practice</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Everything you need to improve—without the distractions.</h2><p className="mt-4 leading-7 text-slate-600">Varadhi keeps preparation focused on practising, reviewing, and deciding what to study next.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">{benefits.map((benefit) => <article key={benefit.number} className="rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-950/5"><span className="text-sm font-black text-teal-700">{benefit.number}</span><h3 className="mt-6 text-xl font-black">{benefit.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{benefit.description}</p></article>)}</div>
      </section>

      <section id="how-it-works" className="bg-slate-950 text-white"><div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.78fr_1.22fr] lg:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-200">A better study loop</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Know what to do after every mock test.</h2><p className="mt-5 leading-7 text-slate-300">Scores matter, but improvement comes from understanding mistakes and returning to the right Subjects.</p></div><ol className="space-y-4">{[["1", "Choose", "Filter by Exam, Paper, or Subject and select the practice that matches today’s goal."], ["2", "Attempt", "Complete the timed test with bilingual content and answers saved as you progress."], ["3", "Review", "Understand correct answers, explanations, accuracy, and the Subjects that need attention."]].map(([number, title, description]) => <li key={number} className="grid grid-cols-[3rem_1fr] gap-4 rounded-2xl border border-slate-700 bg-white/5 p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-300 font-black text-slate-950">{number}</span><div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-300">{description}</p></div></li>)}</ol></div></section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24"><div className="overflow-hidden rounded-[2rem] bg-teal-50 px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-800">Ready for focused practice?</p><h2 className="mt-3 text-3xl font-black tracking-tight">Make your next study session count.</h2><p className="mt-4 leading-7 text-slate-600">Create your account, take a free mock test, and start building a clearer picture of your preparation.</p></div><div className="mt-7 flex shrink-0 flex-wrap gap-3 lg:mt-0"><Link href="/register" className="rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white hover:bg-slate-800">Create free account</Link><Link href="/mock-tests" className="rounded-xl border border-teal-200 bg-white px-5 py-3.5 font-bold text-teal-800 hover:border-teal-300">Browse tests</Link></div></div></section>

      <footer className="border-t bg-slate-50"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-8 text-sm text-slate-500 sm:px-8"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-xs font-black text-white">V</span><span><strong className="text-slate-900">Varadhi</strong><br />TGPSC practice platform</span></div><div className="flex gap-5 font-semibold"><Link href="/mock-tests" className="hover:text-slate-900">Mock tests</Link><Link href="/login" className="hover:text-slate-900">Login</Link><Link href="/register" className="hover:text-slate-900">Register</Link></div></div></footer>
    </main>
  );
}
