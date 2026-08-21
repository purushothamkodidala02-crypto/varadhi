import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import {
  ExamSymbol,
  MockSymbol,
  PaperSymbol,
  StateSymbol,
} from "@/components/exams/CatalogSymbols";
import { PublicHeader } from "@/components/site/PublicHeader";
import { getMockTestCatalogData } from "@/lib/catalog-data";
import { mockTestLabel } from "@/lib/exam-catalog";
import {
  categoryUrl,
  examUrl,
  mockTestUrl,
  paperUrl,
  specializationUrl,
  stateUrl,
  subjectUrl,
} from "@/lib/public-urls";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { resolvePublicRoute } from "@/lib/public-route-data";

export type Filters = {
  state?: string;
  category?: string;
  exam?: string;
  specialization?: string;
  paper?: string;
  subject?: string;
  q?: string;
  type?: string;
  page?: string;
};

export type MockTestsPageProps = {
  searchParams: Promise<Filters>;
  canonicalPath?: string;
};

type MockTestStats = {
  mock_test_id: string;
  question_count: number;
  total_marks: number;
  maximum_negative_marks: number;
};

type CatalogTest = {
  id: string;
  paper_id: string;
  subject_id: string | null;
  test_scope: string;
  series_number: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  access_type: string;
  price_inr: number | null;
  slug: string;
  paper: { id: string; name: string; slug: string };
  exam: { id: string; name: string; slug: string };
  category: { id: string; name: string; slug: string };
  state: { id: string; name: string; code: string; slug: string };
  subject?: { id: string; name: string; slug: string };
  paperDisplay?: { number: number; shortLabel: string; label: string };
  questions: number | null;
  marks: number | null;
};

export async function generateMetadata({ searchParams }: MockTestsPageProps): Promise<Metadata> {
  const filters = await searchParams;
  const title = "State Exam Mock Tests for Telangana & Andhra Pradesh";
  const description =
    "Choose your state, exam and paper to find the right mock-test series. Practise Telangana and Andhra Pradesh exams in English and Telugu.";
  const isFiltered = Boolean(
    filters.state || filters.exam || filters.paper || filters.q || filters.type ||
      (filters.page && filters.page !== "1"),
  );

  return {
    title,
    description,
    alternates: { canonical: "/mock-tests" },
    robots: isFiltered ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: "/mock-tests",
      title,
      description,
      siteName: "Varadhi Prep",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Varadhi Prep state exam mock tests" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

function withQuery(path: string, filters: Filters = {}) {
  const params = new URLSearchParams();
  for (const key of ["q", "type", "page"] as const) {
    const value = filters[key];
    if (value && value !== "all") params.set(key, value);
  }
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

export default async function MockTestsPage({ searchParams, canonicalPath }: MockTestsPageProps) {
  const filters = await searchParams;
  const catalog = await getMockTestCatalogData();
  const { states, categories, exams, specializations, papers, subjects } = catalog;
  const paperDisplayById = buildPaperDisplayMap(papers as OrderedPaper[]);
  const stateById = new Map(states.map((item) => [item.id, item]));
  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const examById = new Map(exams.map((item) => [item.id, item]));
  const specializationById = new Map(specializations.map((item) => [item.id, item]));
  const paperById = new Map(papers.map((item) => [item.id, item]));
  const subjectById = new Map(subjects.map((item) => [item.id, item]));
  const statsByTestId = new Map(
    (catalog.stats as MockTestStats[]).map((item) => [item.mock_test_id, item]),
  );

  const tests = catalog.tests.flatMap((test) => {
    const paper = paperById.get(test.paper_id);
    const exam = paper ? examById.get(paper.exam_group_id) : undefined;
    const category = exam ? categoryById.get(exam.exam_id) : undefined;
    const state = category ? stateById.get(category.state_id) : undefined;
    if (!paper || !exam || !category || !state) return [];
    const subject = test.subject_id ? subjectById.get(test.subject_id) : undefined;
    const specialization = paper.specialization_id ? specializationById.get(paper.specialization_id) : undefined;
    const paperDisplay = paperDisplayById.get(paper.id);
    const stats = statsByTestId.get(test.id);
    const questions = stats ? Number(stats.question_count) : null;
    const marks = stats ? Number(stats.total_marks) : null;
    return [{ ...test, paper, exam, category, state, subject, specialization, paperDisplay, questions, marks }];
  });

  let selectedState = states.find((state) => state.slug === filters.state || state.id === filters.state);
  if (!selectedState && filters.state) selectedState = (await resolvePublicRoute({ stateSlug: filters.state }))?.state;
  let selectedCategory = selectedState
    ? categories.find((category) => category.state_id === selectedState.id && (category.slug === filters.category || category.id === filters.category))
    : undefined;
  if (!selectedCategory && selectedState && filters.category) selectedCategory = (await resolvePublicRoute({ stateSlug: selectedState.slug, categorySlug: filters.category }))?.category;
  const stateExams = selectedState
    ? exams.filter((exam) => categoryById.get(exam.exam_id)?.state_id === selectedState.id && (!selectedCategory || exam.exam_id === selectedCategory.id) && tests.some((test) => test.exam.id === exam.id))
    : [];
  let selectedExam = stateExams.find((exam) => exam.id === filters.exam || exam.slug === filters.exam);
  if (!selectedExam && selectedState && filters.exam) selectedExam = (await resolvePublicRoute({ stateSlug: selectedState.slug, examSlug: filters.exam }))?.exam;
  let selectedSpecialization = selectedExam
    ? specializations.find((item) => item.exam_group_id === selectedExam.id && (item.id === filters.specialization || item.slug === filters.specialization))
    : undefined;
  if (!selectedSpecialization && selectedState && selectedExam && filters.specialization) selectedSpecialization = (await resolvePublicRoute({ stateSlug: selectedState.slug, examSlug: selectedExam.slug, specializationSlug: filters.specialization }))?.specialization;
  const examPapers = selectedExam ? papers.filter((paper) => paper.exam_group_id === selectedExam.id && (!selectedSpecialization || paper.specialization_id === selectedSpecialization.id) && tests.some((test) => test.paper.id === paper.id)) : [];
  let selectedPaper = examPapers.find((paper) => paper.id === filters.paper || paper.slug === filters.paper);
  if (!selectedPaper && selectedState && selectedExam && filters.paper) selectedPaper = (await resolvePublicRoute({ stateSlug: selectedState.slug, examSlug: selectedExam.slug, paperSlug: filters.paper }))?.paper;
  let selectedSubject = selectedPaper
    ? subjects.find((subject) => subject.paper_id === selectedPaper.id && (subject.id === filters.subject || subject.slug === filters.subject))
    : undefined;
  if (!selectedSubject && selectedState && selectedExam && selectedPaper && filters.subject) selectedSubject = (await resolvePublicRoute({ stateSlug: selectedState.slug, examSlug: selectedExam.slug, paperSlug: selectedPaper.slug, subjectSlug: filters.subject }))?.subject;
  if (!canonicalPath && selectedState) {
    const destination = selectedSubject && selectedExam && selectedPaper
      ? subjectUrl(selectedState.slug, selectedExam.slug, selectedPaper.slug, selectedSubject.slug)
      : selectedPaper && selectedExam
        ? paperUrl(selectedState.slug, selectedExam.slug, selectedPaper.slug)
        : selectedSpecialization && selectedExam
          ? specializationUrl(selectedState.slug, selectedExam.slug, selectedSpecialization.slug)
        : selectedExam
          ? examUrl(selectedState.slug, selectedExam.slug)
          : selectedCategory
            ? categoryUrl(selectedState.slug, selectedCategory.slug)
          : stateUrl(selectedState.slug);
    permanentRedirect(withQuery(destination, filters));
  }
  const resolvedCategory = selectedExam ? categoryById.get(selectedExam.exam_id) : selectedCategory;
  const query = filters.q?.trim().toLowerCase() ?? "";
  const isSearching = Boolean(query);
  const matchingTests = tests.filter((test) => {
    const searchable = `${test.state.name} ${test.state.code} ${test.category.name} ${test.exam.name} ${test.paperDisplay?.label ?? test.paper.name} ${test.subject?.name ?? ""} ${test.title}`.toLowerCase();
    return (
      (!selectedState || test.state.id === selectedState.id) &&
      (!selectedCategory || test.category.id === selectedCategory.id) &&
      (!selectedExam || test.exam.id === selectedExam.id) &&
      (!selectedSpecialization || test.specialization?.id === selectedSpecialization.id) &&
      (!selectedPaper || test.paper.id === selectedPaper.id) &&
      (!selectedSubject || test.subject?.id === selectedSubject.id) &&
      (!filters.type || filters.type === "all" || test.test_scope === filters.type) &&
      (!query || searchable.includes(query))
    );
  });
  const pageSize = 24;
  const requestedPage = Number.parseInt(filters.page ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(matchingTests.length / pageSize));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(totalPages, Math.max(1, requestedPage))
    : 1;
  const paginatedTests = matchingTests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const stateStats = new Map(states.map((state) => {
    const stateTests = tests.filter((test) => test.state.id === state.id);
    return [state.id, {
      exams: new Set(stateTests.map((test) => test.exam.id)).size,
      tests: stateTests.length,
    }];
  }));

  const dataError = catalog.hasError;

  return (
    <main className="min-h-screen bg-[#f4f7f8] text-slate-950">
      <PublicHeader />
      <section className="relative overflow-hidden border-b bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(45,212,191,0.16),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal-200">
              <MockSymbol className="h-4 w-4" /> Smart mock-test catalogue
            </p>
            <h1 className="font-display mt-5 max-w-3xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              {selectedExam && selectedState ? `${selectedExam.name} mock tests for ${selectedState.name}` : "Your state. Your exam. The exact paper you need."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {selectedExam ? `Choose the correct ${selectedExam.name} paper, take a timed mock test and review every answer.` : "Move through four clear steps. No mixed AP and TG exams, no unrelated papers, and no confusing test names."}
            </p>
          </div>
          <form action="/mock-tests" className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
            {selectedState && <input type="hidden" name="state" value={selectedState.slug} />}
            <label htmlFor="catalog-search" className="px-1 text-xs font-bold uppercase tracking-[0.13em] text-teal-200">Know the exam name?</label>
            <div className="mt-2 flex gap-2">
              <input id="catalog-search" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Try EO, Group 2, TET, SI…" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-teal-300" />
              <button className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-300 text-slate-950 transition hover:bg-teal-200" aria-label="Search mock tests">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>
              </button>
            </div>
            <p className="mt-2 px-1 text-xs leading-5 text-slate-400">Search by exam, board, paper, or subject.</p>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <CatalogSteps state={selectedState?.name} exam={selectedExam?.name} paper={selectedPaper ? paperDisplayById.get(selectedPaper.id)?.shortLabel : undefined} />

        {dataError ? (
          <section className="mt-7 rounded-3xl border border-red-200 bg-red-50 p-7 text-red-800">
            <h2 className="font-display text-xl">The mock-test catalogue could not be loaded.</h2>
            <p className="mt-2 text-sm">Please refresh the page after the catalogue database update is applied.</p>
          </section>
        ) : isSearching ? (
          <CatalogSection eyebrow="Search results" title={`${matchingTests.length} result${matchingTests.length === 1 ? "" : "s"} for “${filters.q?.trim()}”`} action={<Link href={selectedState ? stateUrl(selectedState.slug) : "/mock-tests"} className="text-sm font-bold text-teal-800">Clear search</Link>}>
            <TestGrid tests={paginatedTests} />
            <CatalogPagination filters={filters} page={currentPage} totalPages={totalPages} basePath={selectedState && selectedExam ? examUrl(selectedState.slug, selectedExam.slug) : selectedState ? stateUrl(selectedState.slug) : "/mock-tests"} />
          </CatalogSection>
        ) : !selectedState ? (
          <CatalogSection eyebrow="Step 1" title="Choose your exam location" description="TG and AP content stays completely separate. Central exams have their own space.">
            <div className="grid gap-4 md:grid-cols-3">
              {states.map((state, index) => {
                const stats = stateStats.get(state.id) ?? { exams: 0, tests: 0 };
                const tones = ["from-teal-50 to-white border-teal-200", "from-amber-50 to-white border-amber-200", "from-indigo-50 to-white border-indigo-200"];
                return <Link key={state.id} href={stateUrl(state.slug)} className={`group rounded-3xl border bg-gradient-to-br p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/5 ${tones[index % tones.length]}`}>
                  <span className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-teal-200"><StateSymbol slug={state.slug} /></span><span className="rounded-full border bg-white/80 px-3 py-1 text-xs font-black tracking-wide text-slate-600">{state.code}</span></span>
                  <h2 className="font-display mt-6 text-2xl">{state.name}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{state.description}</p>
                  <span className="mt-6 flex items-center justify-between border-t border-slate-200/70 pt-4 text-sm"><span className="font-semibold text-slate-500">{stats.exams} exams · {stats.tests} tests</span><span className="font-black text-teal-800 transition group-hover:translate-x-1">Choose →</span></span>
                </Link>;
              })}
            </div>
          </CatalogSection>
        ) : !selectedExam ? (
          <CatalogSection eyebrow={`${selectedState.code} · Step 2`} title={`Choose an exam in ${selectedState.name}`} description="The recruiting board is shown as context, while the exam name stays easy to scan." action={<Link href="/mock-tests" className="text-sm font-bold text-teal-800">Change state</Link>}>
            {stateExams.length === 0 ? <EmptyCatalog title="No exams are published for this state yet" detail="New exams will appear here as soon as their first mock test is published." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{stateExams.map((exam) => {
              const category = categoryById.get(exam.exam_id);
              const examTests = tests.filter((test) => test.exam.id === exam.id);
              const paperCount = new Set(examTests.map((test) => test.paper.id)).size;
              return <Link key={exam.id} href={examUrl(selectedState.slug, exam.slug)} className="group flex min-h-56 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-slate-950/5">
                <span className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-800"><ExamSymbol name={exam.name} /></span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">{category?.name}</span></span>
                <h2 className="font-display mt-5 text-xl leading-7">{exam.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{selectedState.code} · {category?.name}</p>
                <span className="mt-auto flex items-center justify-between border-t pt-4 text-sm"><span className="font-semibold text-slate-500">{paperCount} papers · {examTests.length} tests</span><span className="font-black text-teal-800 transition group-hover:translate-x-1">Open →</span></span>
              </Link>;
            })}</div>}
          </CatalogSection>
        ) : !selectedPaper ? (
          <CatalogSection eyebrow={`${selectedState.code} · ${resolvedCategory?.name} · Step 3`} title={`Choose a paper for ${selectedExam.name}`} description="Paper numbers are generated consistently from the exam structure." action={<Link href={stateUrl(selectedState.slug)} className="text-sm font-bold text-teal-800">Change exam</Link>}>
            {examPapers.length === 0 ? <EmptyCatalog title="No papers are available yet" detail="The admin can add papers from the Exam Structure workspace." /> : <div className="grid gap-4 md:grid-cols-2">{examPapers.map((paper) => {
              const display = paperDisplayById.get(paper.id);
              const specialization = paper.specialization_id ? specializationById.get(paper.specialization_id) : undefined;
              const paperTests = tests.filter((test) => test.paper.id === paper.id);
              return <Link key={paper.id} href={paperUrl(selectedState.slug, selectedExam.slug, paper.slug)} className="group flex items-center gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-teal-200"><PaperSymbol /></span>
                <span className="min-w-0 flex-1"><span className="text-xs font-black uppercase tracking-[0.12em] text-teal-700">{display?.shortLabel ?? "Paper"}{specialization ? ` · ${specialization.name}` : ""}</span><strong className="font-display mt-1 block text-lg leading-6">{paper.name}</strong><span className="mt-2 block text-sm font-semibold text-slate-500">{paperTests.length} mock test{paperTests.length === 1 ? "" : "s"}</span></span>
                <span className="text-xl font-black text-teal-800 transition group-hover:translate-x-1">→</span>
              </Link>;
            })}</div>}
          </CatalogSection>
        ) : (
          <CatalogSection eyebrow={`${selectedState.code} · ${selectedExam.name} · ${paperDisplayById.get(selectedPaper.id)?.shortLabel}`} title="Choose a mock test" description="Tests use one predictable series: Mock Test 01, Mock Test 02, Mock Test 03…" action={<Link href={examUrl(selectedState.slug, selectedExam.slug)} className="text-sm font-bold text-teal-800">Change paper</Link>}>
            <div className="mb-5 flex flex-wrap gap-2">
              {([['all', 'All tests'], ['paper', 'Full paper'], ['subject', 'Subject practice']] as const).map(([value, label]) => <Link key={value} href={withQuery(paperUrl(selectedState.slug, selectedExam.slug, selectedPaper.slug), { type: value })} className={`rounded-full px-4 py-2 text-xs font-black ${(!filters.type && value === 'all') || filters.type === value ? 'bg-slate-950 text-white' : 'border bg-white text-slate-600'}`}>{label}</Link>)}
            </div>
            <TestGrid tests={paginatedTests} />
            <CatalogPagination filters={filters} page={currentPage} totalPages={totalPages} basePath={paperUrl(selectedState.slug, selectedExam.slug, selectedPaper.slug)} />
          </CatalogSection>
        )}
      </div>
    </main>
  );
}

function CatalogSteps({ state, exam, paper }: { state?: string; exam?: string; paper?: string }) {
  const steps = [{ label: "State", value: state }, { label: "Exam", value: exam }, { label: "Paper", value: paper }, { label: "Mock test", value: undefined }];
  const completed = [Boolean(state), Boolean(exam), Boolean(paper), false];
  const activeIndex = paper ? 3 : exam ? 2 : state ? 1 : 0;
  return <ol className="grid grid-cols-4 overflow-hidden rounded-2xl border bg-white shadow-sm">{steps.map((step, index) => <li key={step.label} className={`relative px-3 py-4 text-center sm:px-5 ${index > 0 ? "border-l" : ""} ${index === activeIndex ? "bg-teal-50" : ""}`}><span className={`mx-auto grid h-6 w-6 place-items-center rounded-full text-[11px] font-black ${completed[index] ? "bg-emerald-600 text-white" : index === activeIndex ? "bg-slate-950 text-teal-200" : "bg-slate-100 text-slate-400"}`}>{completed[index] ? "✓" : index + 1}</span><span className="mt-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">{step.label}</span>{step.value && <span className="mt-0.5 hidden truncate text-xs font-semibold text-slate-900 sm:block">{step.value}</span>}</li>)}</ol>;
}

function CatalogSection({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="mt-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-teal-700">{eyebrow}</p><h2 className="font-display mt-2 text-2xl tracking-tight sm:text-3xl">{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}</div>{action}</div>{children}</section>;
}

function TestGrid({ tests }: { tests: CatalogTest[] }) {
  if (tests.length === 0) return <EmptyCatalog title="No matching mock tests" detail="Try another paper or clear the current search." />;
  return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tests.map((test) => <article key={test.id} className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-slate-950/5"><div className="h-1.5 bg-gradient-to-r from-teal-500 to-teal-300" /><div className="flex flex-1 flex-col p-6"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-teal-200"><MockSymbol /></span><span className={`rounded-full px-3 py-1 text-xs font-black ${test.access_type === "free" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{test.access_type === "free" ? "Free" : `₹${test.price_inr ?? "Paid"}`}</span></div><p className="mt-5 text-[11px] font-black uppercase tracking-[0.12em] text-teal-700">{test.state.code} · {test.exam.name} · {test.paperDisplay?.shortLabel ?? "Paper"}</p><h3 className="font-display mt-2 text-2xl">{mockTestLabel(Number(test.series_number ?? 1))}</h3>{test.subject && <p className="mt-1 text-sm font-bold text-slate-700">{test.subject.name}</p>}<p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{test.description ?? "Focused exam practice with saved progress and detailed answer review."}</p><div className="mt-6 grid grid-cols-3 divide-x rounded-2xl bg-slate-50 py-3 text-center"><Metric value={test.questions ?? "—"} label="Questions" /><Metric value={test.duration_minutes} label="Minutes" /><Metric value={test.marks === null ? "—" : Number(test.marks).toFixed(2).replace(/\.00$/, "")} label="Marks" /></div><Link href={mockTestUrl(test.state.slug, test.exam.slug, test.paper.slug, test.slug)} className="mt-5 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition group-hover:bg-teal-700"><span>View test details</span><span>→</span></Link></div></article>)}</div>;
}

function CatalogPagination({ filters, page, totalPages, basePath }: { filters: Filters; page: number; totalPages: number; basePath: string }) {
  if (totalPages <= 1) return null;
  const pageHref = (nextPage?: number) => {
    const nextFilters = { ...filters, page: nextPage && nextPage > 1 ? String(nextPage) : undefined };
    return withQuery(basePath, nextFilters);
  };
  return <nav aria-label="Mock-test pages" className="mt-8 flex items-center justify-center gap-3">
    <Link href={pageHref(page - 1)} aria-disabled={page === 1} className={`rounded-xl border bg-white px-4 py-2.5 text-sm font-bold ${page === 1 ? "pointer-events-none opacity-40" : "hover:border-teal-300"}`}>Previous</Link>
    <span className="text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span>
    <Link href={pageHref(Math.min(totalPages, page + 1))} aria-disabled={page === totalPages} className={`rounded-xl border bg-white px-4 py-2.5 text-sm font-bold ${page === totalPages ? "pointer-events-none opacity-40" : "hover:border-teal-300"}`}>Next</Link>
  </nav>;
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <span><strong className="block text-sm text-slate-950">{value}</strong><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span></span>;
}

function EmptyCatalog({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><h3 className="font-display text-xl">{title}</h3><p className="mt-2 text-sm text-slate-600">{detail}</p></div>;
}
