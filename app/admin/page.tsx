import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [testsResult, assignmentsResult, questionsResult, attemptsResult] =
    await Promise.all([
      supabase
        .from("mock_tests")
        .select("id, title, status, updated_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("mock_test_questions")
        .select("mock_test_id, question_id, marks, negative_marks"),
      supabase.from("questions").select("id, is_active, expires_on"),
      supabase.from("test_attempts").select("id", { count: "exact", head: true }),
    ]);

  const tests = testsResult.data ?? [];
  const questions = questionsResult.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const usableIds = new Set(
    questions
      .filter(
        (item) =>
          item.is_active && (!item.expires_on || item.expires_on >= today),
      )
      .map((item) => item.id),
  );
  type Assignment = NonNullable<typeof assignmentsResult.data>[number];
  const assignmentsByTest = new Map<string, Assignment[]>();
  for (const assignment of assignmentsResult.data ?? []) {
    const current = assignmentsByTest.get(assignment.mock_test_id) ?? [];
    current.push(assignment);
    assignmentsByTest.set(assignment.mock_test_id, current);
  }

  const drafts = tests.filter((test) => test.status === "draft");
  const published = tests.filter((test) => test.status === "published");
  const hidden = tests.filter((test) => test.status === "archived");
  const draftsNeedingWork = drafts.filter((test) => {
    const assignments = assignmentsByTest.get(test.id) ?? [];
    return (
      assignments.length === 0 ||
      assignments.some(
        (item) =>
          !usableIds.has(item.question_id) ||
          Number(item.marks) <= 0 ||
          Number(item.negative_marks) < 0,
      )
    );
  });

  const metrics = [
    {
      label: "Published tests",
      value: published.length,
      detail: "Visible to students",
      href: "/admin/mock-tests",
      accent: "emerald",
      short: "LIVE",
    },
    {
      label: "Draft tests",
      value: drafts.length,
      detail: `${draftsNeedingWork.length} need attention`,
      href: "/admin/mock-tests",
      accent: "amber",
      short: "DRAFT",
    },
    {
      label: "Available questions",
      value: usableIds.size,
      detail: `${questions.length} total in the Question Bank`,
      href: "/admin/questions",
      accent: "teal",
      short: "BANK",
    },
    {
      label: "Completed attempts",
      value: attemptsResult.count ?? 0,
      detail: "Student submissions",
      href: "/admin/results",
      accent: "violet",
      short: "DATA",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 sm:p-9">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-7">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
              Admin overview
            </p>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Content operations
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              See what students can access, identify unfinished tests, and
              continue the most important admin work.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/mock-tests"
              className="rounded-xl bg-teal-300 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-teal-950/20 hover:bg-teal-200"
            >
              Manage mock tests
            </Link>
            <Link
              href="/admin/questions"
              className="rounded-xl border border-slate-700 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:border-slate-500 hover:bg-white/10"
            >
              Open Question Bank
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white px-6 py-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                Priority
              </p>
              <h2 className="mt-2 text-xl font-black">Needs attention</h2>
            </div>
            <Link
              href="/admin/mock-tests"
              className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900 hover:bg-amber-200"
            >
              Review tests
            </Link>
          </div>
          <div className="grid gap-3 p-6">
            <AttentionItem
              count={draftsNeedingWork.length}
              title="Draft tests are not ready"
              detail="Add usable questions and valid marks before publishing."
              tone="amber"
            />
            <AttentionItem
              count={drafts.length - draftsNeedingWork.length}
              title="Draft tests are ready to review"
              detail="Preview these tests and publish them when approved."
              tone="teal"
            />
            <AttentionItem
              count={hidden.length}
              title="Tests are hidden"
              detail="Existing results remain safe; restore a test if it should return."
              tone="slate"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm">
          <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 to-white px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
              Recently updated
            </p>
            <h2 className="mt-2 text-xl font-black">Mock tests</h2>
          </div>
          {tests.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">
              No mock tests have been created.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {tests.slice(0, 5).map((test) => (
                <Link
                  key={test.id}
                  href={`/admin/mock-tests/${test.id}/edit`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-teal-50/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{test.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Updated{" "}
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                      }).format(new Date(test.updated_at))}
                    </p>
                  </div>
                  <Status
                    status={test.status as "draft" | "published" | "archived"}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-slate-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-200">
            Content setup
          </p>
          <h2 className="mt-2 text-2xl font-black">Build in the right order</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Structure the Exam first, add reusable questions, then let Mock
            Tests control student visibility.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <WorkflowLink
              number="01"
              title="Exam structure"
              detail="Categories, Exams, Papers, and Subjects"
              href="/admin/exams"
            />
            <WorkflowLink
              number="02"
              title="Question Bank"
              detail="Create or import reusable questions"
              href="/admin/questions"
            />
            <WorkflowLink
              number="03"
              title="Mock tests"
              detail="Build, preview, and publish tests"
              href="/admin/mock-tests"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

const metricStyles = {
  emerald: {
    card: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
    badge: "bg-emerald-100 text-emerald-800",
    value: "text-emerald-950",
  },
  amber: {
    card: "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
    badge: "bg-amber-100 text-amber-800",
    value: "text-amber-950",
  },
  teal: {
    card: "border-teal-100 bg-gradient-to-br from-teal-50 to-white",
    badge: "bg-teal-100 text-teal-800",
    value: "text-teal-950",
  },
  violet: {
    card: "border-violet-100 bg-gradient-to-br from-violet-50 to-white",
    badge: "bg-violet-100 text-violet-800",
    value: "text-violet-950",
  },
};

function MetricCard({
  label,
  value,
  detail,
  href,
  accent,
  short,
}: {
  label: string;
  value: number;
  detail: string;
  href: string;
  accent: keyof typeof metricStyles;
  short: string;
}) {
  const styles = metricStyles[accent];
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/5 ${styles.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-600">{label}</p>
        <span
          className={`rounded-lg px-2 py-1 text-[9px] font-black tracking-wider ${styles.badge}`}
        >
          {short}
        </span>
      </div>
      <p className={`mt-4 text-3xl font-black tracking-tight ${styles.value}`}>
        {value}
      </p>
      <p className="mt-3 text-xs font-semibold text-slate-500">{detail}</p>
    </Link>
  );
}

function AttentionItem({
  count,
  title,
  detail,
  tone,
}: {
  count: number;
  title: string;
  detail: string;
  tone: "amber" | "teal" | "slate";
}) {
  const colors = {
    amber: "border-amber-100 bg-amber-50 text-amber-950",
    teal: "border-teal-100 bg-teal-50 text-teal-950",
    slate: "border-slate-200 bg-slate-50 text-slate-900",
  };
  return (
    <div className={`flex gap-4 rounded-2xl border p-4 ${colors[tone]}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg font-black shadow-sm">
        {count}
      </span>
      <div>
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-xs leading-5 opacity-75">{detail}</p>
      </div>
    </div>
  );
}

function Status({
  status,
}: {
  status: "draft" | "published" | "archived";
}) {
  const details =
    status === "published"
      ? ["Published", "bg-emerald-100 text-emerald-800"]
      : status === "archived"
        ? ["Hidden", "bg-slate-200 text-slate-700"]
        : ["Draft", "bg-amber-100 text-amber-800"];
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${details[1]}`}
    >
      {details[0]}
    </span>
  );
}

function WorkflowLink({
  number,
  title,
  detail,
  href,
}: {
  number: string;
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-700 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-teal-300/50 hover:bg-white/10"
    >
      <span className="text-xs font-black text-teal-200">{number}</span>
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-300">{detail}</p>
    </Link>
  );
}
