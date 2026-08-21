import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { getMockTestCatalogData } from "@/lib/catalog-data";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { mockTestUrl } from "@/lib/public-urls";
import { createClient } from "@/lib/supabase/server";

type Attempt = {
  id: string;
  mock_test_id: string;
  detailed_review_available: boolean;
  submitted_at: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_questions: number;
};

type AttemptHistorySummary = {
  completed_attempts: number;
  average_score: number;
  latest_score: number | null;
  latest_total_marks: number | null;
  latest_mock_test_id: string | null;
};

type AvailableMockTest = {
  id: string;
  paper_id: string;
  title: string;
  duration_minutes: number;
  slug: string;
};

type SubjectAnalytics = {
  subject_name: string;
  answered_questions: number;
  correct_answers: number;
  accuracy: number;
  net_marks: number;
};

const attemptsPerPage = 20;

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const query = await searchParams;
  const requestedPage = Number(query.page ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [
    attemptsResult,
    attemptSummaryResult,
    latestAttemptsResult,
    subjectAnalyticsResult,
    availableTestsResult,
    allTestsResult,
    papersResult,
    catalog,
  ] = await Promise.all([
    supabase
      .from("test_attempts")
      .select(
        "id, mock_test_id, detailed_review_available, submitted_at, score, total_marks, correct_answers, incorrect_answers, unanswered_questions",
        { count: "exact" },
      )
      .order("submitted_at", { ascending: false })
      .range((page - 1) * attemptsPerPage, page * attemptsPerPage - 1),
    supabase.rpc("get_student_attempt_history_summary"),
    supabase
      .from("test_attempts")
      .select(
        "id, mock_test_id, detailed_review_available, submitted_at, score, total_marks, correct_answers, incorrect_answers, unanswered_questions",
      )
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase.rpc("get_student_subject_analytics"),
    supabase
      .from("mock_tests")
      .select("id, paper_id, title, duration_minutes, slug")
      .eq("status", "published")
      .eq("access_type", "free")
      .order("display_order", { ascending: true }),
    supabase.from("mock_tests").select("id, title"),
    supabase
      .from("papers")
      .select("id, exam_group_id, specialization_id, name, display_order")
      .eq("is_active", true),
    getMockTestCatalogData(),
  ]);

  const attempts = (attemptsResult.data ?? []) as Attempt[];
  const latestAttempts = (latestAttemptsResult.data ?? []) as Attempt[];
  const attemptSummary = (attemptSummaryResult.data?.[0] ?? {
    completed_attempts: attemptsResult.count ?? 0,
    average_score: 0,
    latest_score: null,
    latest_total_marks: null,
    latest_mock_test_id: null,
  }) as AttemptHistorySummary;
  const totalAttempts = Number(attemptSummary.completed_attempts ?? attemptsResult.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalAttempts / attemptsPerPage));
  if (totalAttempts > 0 && page > totalPages) redirect(`/dashboard?page=${totalPages}`);
  const subjectAnalytics = (subjectAnalyticsResult.data ?? []) as SubjectAnalytics[];
  const availableTests = (availableTestsResult.data ?? []) as AvailableMockTest[];
  const paperDisplayById = buildPaperDisplayMap(
    (papersResult.data ?? []) as OrderedPaper[],
  );
  const testTitles = new Map(
    (allTestsResult.data ?? []).map((test) => [test.id, test.title]),
  );
  const catalogPaperById = new Map(catalog.papers.map((item) => [item.id, item]));
  const catalogExamById = new Map(catalog.exams.map((item) => [item.id, item]));
  const catalogCategoryById = new Map(catalog.categories.map((item) => [item.id, item]));
  const catalogStateById = new Map(catalog.states.map((item) => [item.id, item]));
  const publicTestPath = (test: AvailableMockTest) => {
    const paper = catalogPaperById.get(test.paper_id);
    const exam = paper ? catalogExamById.get(paper.exam_group_id) : undefined;
    const category = exam ? catalogCategoryById.get(exam.exam_id) : undefined;
    const state = category ? catalogStateById.get(category.state_id) : undefined;
    return paper && exam && state ? mockTestUrl(state.slug, exam.slug, paper.slug, test.slug) : "/mock-tests";
  };
  const metrics = [
    {
      label: "Completed attempts",
      value: String(totalAttempts),
      detail: "All submitted tests",
      tone: "teal",
      short: "DONE",
    },
    {
      label: "Average score",
      value: `${Number(attemptSummary.average_score).toFixed(1)}%`,
      detail: "Across all attempts",
      tone: "emerald",
      short: "AVG",
    },
    {
      label: "Latest score",
      value: attemptSummary.latest_score !== null && attemptSummary.latest_total_marks !== null
        ? `${attemptSummary.latest_score} / ${attemptSummary.latest_total_marks}`
        : "—",
      detail: attemptSummary.latest_mock_test_id
        ? (testTitles.get(attemptSummary.latest_mock_test_id) ?? "Mock test")
        : "No attempts yet",
      tone: "amber",
      short: "NEW",
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[#f5f8f8]">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/15 sm:px-9 sm:py-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-300/15 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-7">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
                Student dashboard
              </p>
              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                Keep your preparation moving.
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Review your progress, understand weak Subjects, and choose the
                next focused mock test.
              </p>
            </div>
            <Link
              href="/mock-tests"
              className="rounded-xl bg-teal-300 px-5 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-teal-950/20 hover:bg-teal-200"
            >
              Find a mock test
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <DashboardMetric key={metric.label} {...metric} />
          ))}
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
                Available now
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Choose your next practice test
              </h2>
            </div>
            <Link
              href="/mock-tests"
              className="text-sm font-bold text-teal-700 hover:text-teal-800"
            >
              Browse the full library
            </Link>
          </div>
          {availableTests.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-600">
              No mock tests are available right now.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {availableTests.slice(0, 4).map((test, index) => (
                <article
                  key={test.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-950/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-xs font-black text-teal-800">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      Free
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-black leading-7 text-slate-950">
                    {test.title}
                  </h3>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-teal-700">
                    {paperDisplayById.get(test.paper_id)?.label ?? "Paper"}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm font-semibold text-slate-500">
                      {test.duration_minutes} minutes
                    </span>
                    <Link
                      href={publicTestPath(test)}
                      className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white group-hover:bg-teal-700"
                    >
                      View test
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {totalAttempts === 0 ? (
          <section className="mt-10 rounded-3xl border border-dashed border-teal-200 bg-gradient-to-br from-white to-teal-50 p-10 text-center shadow-sm">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-100 text-lg font-black text-teal-800">
              01
            </span>
            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Your progress will appear here
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
              Finish your first mock test to unlock score trends, Subject
              accuracy, and detailed answer review.
            </p>
            <Link
              href="/mock-tests"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Browse mock tests
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-10 grid gap-5 lg:grid-cols-2">
              <AnalyticsCard
                eyebrow="Performance"
                title="Score trend"
                detail="Your five latest attempts."
              >
                <div className="space-y-5">
                  {latestAttempts.map((attempt) => {
                    const percentage =
                      attempt.total_marks === 0
                        ? 0
                        : Math.max(
                            0,
                            Math.min(
                              100,
                              (attempt.score / attempt.total_marks) * 100,
                            ),
                          );
                    return (
                      <div key={attempt.id}>
                        <div className="mb-2 flex justify-between gap-4 text-sm">
                          <span className="truncate font-semibold text-slate-700">
                            {testTitles.get(attempt.mock_test_id) ?? "Mock test"}
                          </span>
                          <span className="font-black text-slate-950">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-teal-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AnalyticsCard>

              <AnalyticsCard
                eyebrow="Study guidance"
                title="Subject accuracy"
                detail="Based on questions you answered."
              >
                {subjectAnalytics.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    Answer more questions to unlock Subject analytics.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {subjectAnalytics.map((subject) => {
                      const accuracy = Math.max(
                        0,
                        Math.min(100, Number(subject.accuracy)),
                      );
                      return (
                        <div key={subject.subject_name}>
                          <div className="mb-2 flex justify-between gap-4 text-sm">
                            <span className="font-semibold text-slate-700">
                              {subject.subject_name}
                            </span>
                            <span className="font-black text-slate-950">
                              {accuracy.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            {subject.correct_answers} correct out of{" "}
                            {subject.answered_questions} answered
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AnalyticsCard>
            </section>

            <section className="mt-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
                  History
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Exam history
                </h2>
                <p className="mt-2 text-sm text-slate-600">Showing {((page - 1) * attemptsPerPage) + 1} to {Math.min(page * attemptsPerPage, totalAttempts)} of {totalAttempts} completed exams.</p>
              </div>
              <div className="mt-5 grid gap-4">
                {attempts.map((attempt) => (
                  <article
                    key={attempt.id}
                    className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Submitted{" "}
                          {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(attempt.submitted_at))}
                        </p>
                        <h3 className="mt-2 text-lg font-black text-slate-950">
                          {testTitles.get(attempt.mock_test_id) ?? "Mock test"}
                        </h3>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                          <ResultBadge
                            label={`${attempt.correct_answers} correct`}
                            tone="emerald"
                          />
                          <ResultBadge
                            label={`${attempt.incorrect_answers} incorrect`}
                            tone="red"
                          />
                          <ResultBadge
                            label={`${attempt.unanswered_questions} unanswered`}
                            tone="slate"
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Score
                          </p>
                          <p className="mt-1 text-xl font-black text-slate-950">
                            {attempt.score} / {attempt.total_marks}
                          </p>
                        </div>
                        {attempt.detailed_review_available ? (
                          <Link
                            href={`/dashboard/attempts/${attempt.id}`}
                            className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-teal-700"
                          >
                            Review
                          </Link>
                        ) : (
                          <span title="Detailed answers are retained for 365 days or the latest 100 attempts." className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">Summary only</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {totalPages > 1 && (
                <nav aria-label="Exam history pages" className="mt-6 flex items-center justify-center gap-3">
                  {page > 1 ? <Link href={page === 2 ? "/dashboard" : `/dashboard?page=${page - 1}`} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-teal-300">Previous</Link> : <span className="rounded-xl border bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-400">Previous</span>}
                  <span className="text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span>
                  {page < totalPages ? <Link href={`/dashboard?page=${page + 1}`} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-teal-300">Next</Link> : <span className="rounded-xl border bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-400">Next</span>}
                </nav>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const metricStyles = {
  teal: "border-teal-100 bg-gradient-to-br from-teal-50 to-white text-teal-950",
  emerald:
    "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-950",
  amber:
    "border-amber-100 bg-gradient-to-br from-amber-50 to-white text-amber-950",
};

function DashboardMetric({
  label,
  value,
  detail,
  tone,
  short,
}: {
  label: string;
  value: string;
  detail: string;
  tone: keyof typeof metricStyles;
  short: string;
}) {
  return (
    <article
      className={`rounded-2xl border p-6 shadow-sm ${metricStyles[tone]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-600">{label}</p>
        <span className="rounded-lg bg-white/80 px-2 py-1 text-[9px] font-black tracking-wider text-slate-500 shadow-sm">
          {short}
        </span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 truncate text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function AnalyticsCard({
  eyebrow,
  title,
  detail,
  children,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ResultBadge({
  label,
  tone,
}: {
  label: string;
  tone: "emerald" | "red" | "slate";
}) {
  const styles = {
    emerald: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-800",
    slate: "bg-slate-100 text-slate-600",
  };
  return <span className={`rounded-full px-3 py-1 ${styles[tone]}`}>{label}</span>;
}
