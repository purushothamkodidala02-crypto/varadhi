import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";

const benefits = [
  ["Exam-wise practice", "Choose Group I–IV or a recruitment exam and focus on the syllabus that matters."],
  ["Timed test experience", "Practise in a calm, real test-style screen with your answers saved safely."],
  ["Clear progress", "See your scores, review attempts, and understand subject accuracy after every test."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />

      <section className="overflow-hidden bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-18 sm:px-8 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-teal-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
              TGPSC preparation platform
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
              Prepare with clarity. Perform with confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Varadhi helps Telangana aspirants practise published mock tests,
              improve accuracy, and track progress in one focused place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/mock-tests"
                className="rounded-xl bg-teal-300 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-teal-300/10 transition hover:bg-teal-200"
              >
                Explore mock tests
              </Link>
              <Link
                href="/exams"
                className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-white transition hover:border-slate-500 hover:bg-slate-900"
              >
                Browse exam categories
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-700 bg-white/5 p-6 shadow-2xl shadow-black/20 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-200">
              A simple study flow
            </p>
            <ol className="mt-7 space-y-5">
              {[
                ["01", "Choose your exam", "See Group and job-wise tests in one catalogue."],
                ["02", "Take a timed mock", "Answer confidently; progress is saved as you go."],
                ["03", "Review your progress", "Use your dashboard to plan the next study session."],
              ].map(([number, title, description]) => (
                <li key={number} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-300 font-black text-slate-950">
                    {number}
                  </span>
                  <div>
                    <h2 className="font-bold text-white">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700">
            Built for serious practice
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Everything students need. Nothing distracting.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {benefits.map(([title, description], index) => (
            <article key={title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-sm font-black text-teal-700">
                0{index + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
