import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/server";

type PublishedMockTest = {
  id: string;
  exam_group_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  access_type: "free" | "paid";
  price_inr: number | null;
};

type ExamEntry = {
  id: string;
  name: string;
  exam_type: string;
};

function entryTypeLabel(type: string) {
  if (type === "gazetted") return "Gazetted Exam";
  if (type === "non_gazetted") return "Non-Gazetted Exam";
  if (type === "other") return "Other Exam";
  return "Group Exam";
}

export default async function MockTestsPage(props: PageProps<"/mock-tests">) {
  const searchParams = await props.searchParams;
  const selectedGroupId = typeof searchParams.group === "string" ? searchParams.group : undefined;
  const supabase = await createClient();
  const [testsResult, entriesResult] = await Promise.all([
    supabase
      .from("mock_tests")
      .select("id, exam_group_id, title, description, duration_minutes, access_type, price_inr")
      .eq("status", "published")
      .order("display_order", { ascending: true }),
    supabase
      .from("exam_groups")
      .select("id, name, exam_type")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  const mockTests = (testsResult.data ?? []) as PublishedMockTest[];
  const entries = (entriesResult.data ?? []) as ExamEntry[];
  const selectedEntry = entries.find((entry) => entry.id === selectedGroupId);
  const visibleEntries = selectedEntry ? [selectedEntry] : entries;
  const visibleTests = selectedEntry
    ? mockTests.filter((test) => test.exam_group_id === selectedEntry.id)
    : mockTests;

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-teal-700">
              Practice library
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              {selectedEntry ? `${selectedEntry.name} Mock Tests` : "Find your next mock test"}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {selectedEntry
                ? `Published tests for ${selectedEntry.name}. Choose one and begin when you are ready.`
                : "Free and paid practice tests organised by Group and recruitment exam."}
            </p>
          </div>
          {selectedEntry ? (
            <Link href="/mock-tests" className="rounded-xl border bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100">
              View all tests
            </Link>
          ) : (
            <Link href="/exams" className="rounded-xl border bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100">
              Browse by exam
            </Link>
          )}
        </div>

        {visibleTests.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center text-slate-600">
            {selectedEntry
              ? `No mock tests have been published for ${selectedEntry.name} yet.`
              : "No mock tests have been published yet."}
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {visibleEntries.map((entry) => {
              const entryTests = visibleTests.filter((test) => test.exam_group_id === entry.id);
              if (entryTests.length === 0) return null;

              return (
                <section key={entry.id}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-950">{entry.name}</h2>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                      {entryTypeLabel(entry.exam_type)}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    {entryTests.map((mockTest) => (
                      <article key={mockTest.id} className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-xl font-bold leading-7 text-slate-950">{mockTest.title}</h3>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${mockTest.access_type === "paid" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {mockTest.access_type === "paid" ? `₹${mockTest.price_inr}` : "Free"}
                          </span>
                        </div>
                        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
                          {mockTest.description ?? "A Varadhi practice test."}
                        </p>
                        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                          <span className="text-sm font-semibold text-slate-600">{mockTest.duration_minutes} minutes</span>
                          <Link href={`/mock-tests/${mockTest.id}`} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">
                            {mockTest.access_type === "paid" ? "View access" : "Start test"}
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
