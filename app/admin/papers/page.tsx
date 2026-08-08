import { createClient } from "@/lib/supabase/server";
import { ExistingPapersTable } from "./ExistingPapersTable";
import { PaperForm } from "./PaperForm";

export default async function PapersPage() {
  const supabase = await createClient();
  const [papersResult, groupsResult, categoriesResult] = await Promise.all([
    supabase
      .from("papers")
      .select(
        "id, exam_group_id, name, slug, duration_minutes, question_count, is_active, display_order",
      )
      .order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name, display_order").order("display_order"),
    supabase.from("exams").select("id, name"),
  ]);

  const categoriesById = new Map(
    (categoriesResult.data ?? []).map((category) => [category.id, category.name]),
  );
  const exams = groupsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const examOptions = exams.map((exam) => ({
    id: exam.id,
    label: `${categoriesById.get(exam.exam_id) ?? "Unknown category"} → ${exam.name}`,
  }));

  return (
    <main>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
          Exam structure
        </p>
        <h1 className="mt-2 text-3xl font-black">Papers</h1>
        <p className="mt-2 text-slate-600">
          Create the actual government Papers under each Exam. Full-length mocks always
          belong to one Paper.
        </p>
      </div>

      <PaperForm exams={examOptions} />

      {papersResult.error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          {papersResult.error.message}
        </p>
      ) : (
        <ExistingPapersTable
          exams={examOptions}
          papers={papers.map((paper) => ({
            id: paper.id,
            examId: paper.exam_group_id,
            name: paper.name,
            slug: paper.slug,
            durationMinutes: paper.duration_minutes,
            questionCount: paper.question_count,
            isActive: paper.is_active,
          }))}
        />
      )}
    </main>
  );
}
