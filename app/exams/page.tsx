import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Exam = { id: string; name: string; description: string | null };
type ExamGroup = { id: string; exam_id: string; name: string; description: string | null; exam_type: string };

function groupTypeLabel(type: string) {
  if (type === "gazetted") return "Gazetted Exam";
  if (type === "non_gazetted") return "Non-Gazetted Exam";
  if (type === "other") return "Other Exam";
  return "Group Exam";
}

export default async function ExamsPage() {
  const supabase = await createClient();
  const [examsResult, groupsResult] = await Promise.all([
    supabase.from("exams").select("id, name, description").eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("exam_groups").select("id, exam_id, name, description, exam_type").eq("is_active", true).order("display_order", { ascending: true }),
  ]);
  const exams = (examsResult.data ?? []) as Exam[];
  const groups = (groupsResult.data ?? []) as ExamGroup[];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-5xl"><Link href="/" className="text-sm font-medium text-gray-600 hover:text-black">← Varadhi home</Link><h1 className="mt-6 text-3xl font-bold">Exams</h1><p className="mt-2 text-gray-600">Choose an exam entry to explore preparation material and published mock tests.</p>{exams.length === 0 ? <div className="mt-8 rounded-xl border border-dashed p-8 text-center text-gray-600">No exams are available yet.</div> : <div className="mt-8 space-y-6">{exams.map((exam) => { const entries = groups.filter((group) => group.exam_id === exam.id); return <section key={exam.id} className="rounded-2xl border bg-white p-6"><h2 className="text-2xl font-semibold">{exam.name}</h2>{exam.description && <p className="mt-2 text-gray-600">{exam.description}</p>}<div className="mt-6 grid gap-4 sm:grid-cols-2">{entries.map((entry) => <article key={entry.id} className="rounded-xl border p-5"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{groupTypeLabel(entry.exam_type)}</p><h3 className="mt-2 text-lg font-semibold">{entry.name}</h3><p className="mt-2 min-h-10 text-sm text-gray-600">{entry.description ?? "Browse published mock tests for this exam entry."}</p><Link href="/mock-tests" className="mt-5 inline-flex text-sm font-semibold hover:underline">View Mock Tests →</Link></article>)}</div></section>; })}</div>}</div>
    </main>
  );
}
