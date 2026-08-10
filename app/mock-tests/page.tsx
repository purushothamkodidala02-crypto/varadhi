import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { createClient } from "@/lib/supabase/server";
import { MockTestFilters } from "./MockTestFilters";

type Filters = { q?: string; category?: string; exam?: string; paper?: string; subject?: string; type?: string };
type MockTestsPageProps = { searchParams: Promise<Filters> };

export async function generateMetadata({ searchParams }: MockTestsPageProps): Promise<Metadata> {
  const filters = await searchParams;
  const isFiltered = Boolean(
    filters.q?.trim() ||
      filters.category ||
      filters.exam ||
      filters.paper ||
      filters.subject ||
      (filters.type && filters.type !== "all"),
  );

  return {
    title: "Free TGPSC Mock Tests by Exam, Paper & Subject",
    description:
      "Browse free TGPSC mock tests by exam, Paper number, and subject. Practise timed tests in English and Telugu and review your answers on Varadhi.",
    alternates: { canonical: "/mock-tests" },
    robots: isFiltered ? { index: false, follow: true } : undefined,
    openGraph: {
      title: "Free TGPSC Mock Tests by Exam, Paper & Subject",
      description:
        "Find free TGPSC Paper-wise and subject-wise mock tests for focused Telangana exam preparation.",
      url: "/mock-tests",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Free TGPSC Mock Tests by Exam, Paper & Subject",
      description:
        "Find free TGPSC Paper-wise and subject-wise mock tests for focused Telangana exam preparation.",
    },
  };
}

export default async function MockTestsPage({ searchParams }: MockTestsPageProps) {
  const filters = await searchParams;
  const supabase = await createClient();
  const [categoriesResult, examsResult, specializationsResult, papersResult, subjectsResult, testsResult] = await Promise.all([
    supabase.from("exams").select("id, name").eq("is_active", true).order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name").eq("is_active", true).order("display_order"),
    supabase.from("exam_specializations").select("id, name").eq("is_active", true).order("display_order"),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, display_order, question_count, default_correct_marks").eq("is_active", true).order("display_order"),
    supabase.from("subjects").select("id, paper_id, name").eq("is_active", true).order("display_order"),
    supabase.from("mock_tests").select("id, paper_id, subject_id, test_scope, title, description, duration_minutes").eq("status", "published").eq("access_type", "free").order("display_order"),
  ]);

  const categories = categoriesResult.data ?? [];
  const exams = examsResult.data ?? [];
  const specializations = specializationsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const paperDisplayById = buildPaperDisplayMap(papers as OrderedPaper[]);
  const subjects = subjectsResult.data ?? [];
  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const examById = new Map(exams.map((item) => [item.id, item]));
  const specializationById = new Map(specializations.map((item) => [item.id, item]));
  const paperById = new Map(papers.map((item) => [item.id, item]));
  const subjectById = new Map(subjects.map((item) => [item.id, item]));

  const query = filters.q?.trim().toLowerCase() ?? "";
  const tests = (testsResult.data ?? []).map((test) => {
    const paper = paperById.get(test.paper_id);
    const exam = paper ? examById.get(paper.exam_group_id) : undefined;
    const category = exam ? categoryById.get(exam.exam_id) : undefined;
    const specialization = paper?.specialization_id ? specializationById.get(paper.specialization_id) : undefined;
    const subject = test.subject_id ? subjectById.get(test.subject_id) : undefined;
    const paperDisplay = paper ? paperDisplayById.get(paper.id) : undefined;
    const configuredQuestions = Number(paper?.question_count ?? 0);
    const questions =
      test.test_scope === "paper" && configuredQuestions > 0
        ? configuredQuestions
        : null;
    const marks = questions
      ? questions * Number(paper?.default_correct_marks ?? 0)
      : null;
    return { ...test, paper, paperDisplay, exam, category, specialization, subject, stats: { questions, marks } };
  }).filter((test) =>
    (!filters.category || test.category?.id === filters.category) &&
    (!filters.exam || test.exam?.id === filters.exam) &&
    (!filters.paper || test.paper?.id === filters.paper) &&
    (!filters.subject || test.subject?.id === filters.subject) &&
    (!filters.type || filters.type === "all" || test.test_scope === filters.type) &&
    (!query || `${test.title} ${test.description ?? ""} ${test.exam?.name ?? ""} ${test.paperDisplay?.label ?? ""} ${test.subject?.name ?? ""}`.toLowerCase().includes(query)),
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <section className="border-b bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-18">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">Practice library</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Find the right TGPSC mock test for today&apos;s preparation.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Browse free English and Telugu tests in one place. Filter by Exam, Paper number, Subject, or practice type.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <MockTestFilters categories={categories.map((item) => ({ id: item.id, name: item.name }))} exams={exams.map((item) => ({ id: item.id, name: item.name, categoryId: item.exam_id }))} papers={papers.map((item) => ({ id: item.id, name: paperDisplayById.get(item.id)?.label ?? item.name, examId: item.exam_group_id }))} subjects={subjects.map((item) => ({ id: item.id, name: item.name, paperId: item.paper_id }))} initial={filters} />

        <div className="mt-9 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Available now</p><h2 className="mt-2 text-2xl font-black">{tests.length} mock test{tests.length === 1 ? "" : "s"}</h2></div><p className="text-sm text-slate-500">All displayed tests are free to attempt.</p></div>

        {testsResult.error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">Unable to load mock tests right now.</p> : tests.length === 0 ? <section className="mt-6 rounded-3xl border border-dashed bg-white p-12 text-center"><h3 className="text-xl font-black">No mock tests match these filters</h3><p className="mt-2 text-sm text-slate-600">Clear one or more filters to see other available tests.</p><Link href="/mock-tests" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">View all tests</Link></section> : <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tests.map((test) => <article key={test.id} className="flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-950/5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Free</span><span className="text-xs font-bold text-slate-500">{test.test_scope === "paper" ? "Full-length" : "Subject test"}</span></div><p className="mt-5 text-xs font-bold uppercase tracking-wide text-teal-700">{test.exam?.name ?? "TGPSC"}{test.specialization ? ` · ${test.specialization.name}` : ""}</p><h3 className="mt-2 text-xl font-black leading-7">{test.title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{test.description ?? "Focused mock-test practice for serious preparation."}</p><div className="mt-6 grid grid-cols-3 gap-2 border-y py-4 text-center"><div><strong className="block text-sm text-slate-950">{test.stats.questions ?? "—"}</strong><span className="text-xs text-slate-500">Questions</span></div><div><strong className="block text-sm text-slate-950">{test.duration_minutes}</strong><span className="text-xs text-slate-500">Minutes</span></div><div><strong className="block text-sm text-slate-950">{test.stats.marks === null ? "—" : test.stats.marks.toFixed(2).replace(/\.00$/, "")}</strong><span className="text-xs text-slate-500">Marks</span></div></div><p className="mt-4 text-xs font-semibold leading-5 text-slate-500">{test.paperDisplay?.label ?? "Paper"}{test.subject ? ` → ${test.subject.name}` : ""}</p><Link href={`/mock-tests/${test.id}`} className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white hover:bg-slate-800">View test details</Link></article>)}</div>}
      </div>
    </main>
  );
}
