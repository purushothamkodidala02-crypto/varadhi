import Link from "next/link";
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
  display_order: number;
};

function entryTypeLabel(type: string) {
  if (type === "gazetted") return "Gazetted Exam";
  if (type === "non_gazetted") return "Non-Gazetted Exam";
  if (type === "other") return "Other Exam";
  return "Group Exam";
}

export default async function MockTestsPage() {
  const supabase = await createClient();
  const [testsResult, entriesResult] = await Promise.all([
    supabase
      .from("mock_tests")
      .select("id, exam_group_id, title, description, duration_minutes, access_type, price_inr")
      .eq("status", "published")
      .order("display_order", { ascending: true }),
    supabase
      .from("exam_groups")
      .select("id, name, exam_type, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  const mockTests = (testsResult.data ?? []) as PublishedMockTest[];
  const entries = (entriesResult.data ?? []) as ExamEntry[];

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold">Mock Tests</h1>
      <p className="mt-2 text-gray-600">Practice with published tests organized by Group Exam or specific recruitment exam.</p>

      {mockTests.length === 0 ? <div className="mt-8 rounded-xl border border-dashed p-8 text-center text-gray-600">No Mock Tests have been published yet.</div> : <div className="mt-8 space-y-8">{entries.map((entry) => { const entryTests = mockTests.filter((test) => test.exam_group_id === entry.id); if (entryTests.length === 0) return null; return <section key={entry.id}><div className="flex items-baseline gap-3"><h2 className="text-2xl font-semibold">{entry.name}</h2><span className="text-sm text-gray-500">{entryTypeLabel(entry.exam_type)}</span></div><div className="mt-4 grid gap-4 md:grid-cols-2">{entryTests.map((mockTest) => <article key={mockTest.id} className="rounded-xl border bg-white p-6"><div className="flex items-start justify-between gap-4"><h3 className="text-xl font-semibold">{mockTest.title}</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${mockTest.access_type === "paid" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>{mockTest.access_type === "paid" ? `₹${mockTest.price_inr}` : "Free"}</span></div><p className="mt-2 min-h-12 text-sm text-gray-600">{mockTest.description ?? "A Varadhi practice test."}</p><div className="mt-5 flex items-center justify-between"><span className="text-sm font-medium">{mockTest.duration_minutes} minutes</span><Link href={`/mock-tests/${mockTest.id}`} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">{mockTest.access_type === "paid" ? "View Access" : "Start Test"}</Link></div></article>)}</div></section>; })}</div>}
    </main>
  );
}
