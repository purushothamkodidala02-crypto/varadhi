import { createClient } from "@/lib/supabase/server";
import { CreateSubjectForm } from "./CreateSubjectForm";
import { ExistingSubjectsTable } from "./ExistingSubjectsTable";

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
  const examById = new Map(exams.map((exam) => [exam.id, exam]));
  const paperById = new Map(papers.map((paper) => [paper.id, paper]));

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

      <CreateSubjectForm categories={categories} exams={exams} papers={papers} />

      {subjectsResult.error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          {subjectsResult.error.message}
        </p>
      ) : (
        <ExistingSubjectsTable
          categories={categories}
          exams={exams.map((exam) => ({
            id: exam.id,
            categoryId: exam.exam_id,
            name: exam.name,
          }))}
          papers={papers.map((paper) => ({
            id: paper.id,
            examId: paper.exam_group_id,
            name: paper.name,
          }))}
          subjects={subjects.map((subject) => {
            const paper = paperById.get(subject.paper_id);
            const exam = paper ? examById.get(paper.exam_group_id) : undefined;

            return {
              id: subject.id,
              categoryId: exam?.exam_id ?? "",
              examId: exam?.id ?? "",
              paperId: paper?.id ?? "",
              examName: exam?.name ?? "Unknown Exam",
              paperName: paper?.name ?? "Unknown Paper",
              name: subject.name,
              slug: subject.slug,
              isActive: subject.is_active,
            };
          })}
        />
      )}
    </main>
  );
}
