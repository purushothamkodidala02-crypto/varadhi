import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/server";

type Exam = { id: string; name: string; description: string | null };
type ExamGroup = {
  id: string;
  exam_id: string;
  name: string;
  description: string | null;
  exam_type: string;
};

function groupTypeLabel(type: string) {
  if (type === "gazetted") return "Gazetted Exam";
  if (type === "non_gazetted") return "Non-Gazetted Exam";
  if (type === "other") return "Other Exam";
  return "Group Exam";
}

export default async function ExamsPage() {
  const supabase = await createClient();
  const [examsResult, groupsResult] = await Promise.all([
    supabase
      .from("exams")
      .select("id, name, description")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("exam_groups")
      .select("id, exam_id, name, description, exam_type")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);
  const exams = (examsResult.data ?? []) as Exam[];
  const groups = (groupsResult.data ?? []) as ExamGroup[];

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl">
          <Link href="/" className="text-sm font-bold text-teal-700 hover:text-teal-800">
            ← Back to home
          </Link>
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.15em] text-teal-700">
            Find your exam
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Choose an exam. Start practising.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Open an exam entry to see only the mock tests prepared for it.
          </p>
        </div>

        {exams.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center text-slate-600">
            No exams are available yet.
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {exams.map((exam) => {
              const entries = groups.filter((group) => group.exam_id === exam.id);

              return (
                <section key={exam.id} className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
                        Exam board
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">{exam.name}</h2>
                    </div>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                      {entries.length} exam {entries.length === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                  {exam.description && <p className="mt-4 text-slate-600">{exam.description}</p>}
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {entries.map((entry) => (
                      <article key={entry.id} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white hover:shadow-md">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          {groupTypeLabel(entry.exam_type)}
                        </p>
                        <h3 className="mt-3 text-xl font-bold text-slate-950">{entry.name}</h3>
                        <p className="mt-2 min-h-10 text-sm leading-6 text-slate-600">
                          {entry.description ?? "Browse published mock tests for this exam entry."}
                        </p>
                        <Link
                          href={`/mock-tests?group=${entry.id}`}
                          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700 transition group-hover:text-teal-800"
                        >
                          See mock tests <span aria-hidden="true">→</span>
                        </Link>
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
