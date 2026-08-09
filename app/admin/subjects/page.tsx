import { createClient } from "@/lib/supabase/server";
import { SubjectsWorkspace } from "./SubjectsWorkspace";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const [subjectsResult, papersResult, groupsResult, categoriesResult] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, paper_id, name, slug, is_active, display_order")
      .order("display_order"),
    supabase
      .from("papers")
      .select("id, exam_group_id, name, display_order")
      .order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name").order("display_order"),
    supabase.from("exams").select("id, name").order("display_order"),
  ]);

  const categories = categoriesResult.data ?? [];
  const exams = groupsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const subjects = subjectsResult.data ?? [];

  return (
    <main>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
          Exam structure
        </p>
        <h1 className="mt-2 text-3xl font-black">Subjects</h1>
        <p className="mt-2 text-slate-600">
          Choose the Category, Exam, and Paper first, then add all of its Subjects.
        </p>
      </div>

      <SubjectsWorkspace
        categories={categories}
        exams={exams}
        papers={papers}
        subjects={subjects.map((subject) => ({
          id: subject.id,
          paperId: subject.paper_id,
          name: subject.name,
          slug: subject.slug,
          isActive: subject.is_active,
        }))}
      />

      {subjectsResult.error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          {subjectsResult.error.message}
        </p>
      )}
    </main>
  );
}
