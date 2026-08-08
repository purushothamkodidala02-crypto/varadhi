import { createClient } from "@/lib/supabase/server";
import { CreateMockTestForm } from "./CreateMockTestForm";
import { ExistingMockTestsTable } from "./ExistingMockTestsTable";

export default async function MockTestsPage() {
  const supabase = await createClient();
  const [testsResult, subjectsResult, papersResult, groupsResult, categoriesResult] =
    await Promise.all([
      supabase
        .from("mock_tests")
        .select(
          "id, paper_id, subject_id, test_scope, title, slug, duration_minutes, status, access_type, price_inr, display_order",
        )
        .order("display_order"),
      supabase.from("subjects").select("id, paper_id, name"),
      supabase
        .from("papers")
        .select("id, exam_group_id, name, duration_minutes")
        .order("display_order"),
      supabase.from("exam_groups").select("id, exam_id, name").order("display_order"),
      supabase.from("exams").select("id, name").order("display_order"),
    ]);

  const categories = categoriesResult.data ?? [];
  const exams = groupsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const subjects = subjectsResult.data ?? [];
  const tests = testsResult.data ?? [];
  const paperById = new Map(papers.map((paper) => [paper.id, paper]));
  const examById = new Map(exams.map((exam) => [exam.id, exam]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

  return (
    <main>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
          Test builder
        </p>
        <h1 className="mt-2 text-3xl font-black">Mock Tests</h1>
        <p className="mt-2 text-slate-600">
          Paper-wise mocks use every Subject in a Paper. Subject-wise mocks use one
          selected Subject.
        </p>
      </div>

      <CreateMockTestForm
        categories={categories.map((item) => ({ id: item.id, name: item.name }))}
        exams={exams.map((item) => ({
          id: item.id,
          categoryId: item.exam_id,
          name: item.name,
        }))}
        papers={papers.map((item) => ({
          id: item.id,
          examId: item.exam_group_id,
          name: item.name,
          duration: item.duration_minutes,
        }))}
        subjects={subjects.map((item) => ({
          id: item.id,
          paperId: item.paper_id,
          name: item.name,
        }))}
      />

      {testsResult.error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          {testsResult.error.message}
        </p>
      ) : (
        <ExistingMockTestsTable
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
          tests={tests.map((test) => {
            const paper = paperById.get(test.paper_id);
            const exam = paper ? examById.get(paper.exam_group_id) : undefined;
            const subject = test.subject_id
              ? subjectById.get(test.subject_id)
              : undefined;

            return {
              id: test.id,
              categoryId: exam?.exam_id ?? "",
              examId: exam?.id ?? "",
              paperId: paper?.id ?? "",
              examName: exam?.name ?? "Unknown Exam",
              paperName: paper?.name ?? "Unknown Paper",
              title: test.title,
              slug: test.slug,
              durationMinutes: test.duration_minutes,
              scope: test.test_scope as "paper" | "subject",
              subjectName: subject?.name ?? null,
              status: test.status as "draft" | "published" | "archived",
              accessType: test.access_type as "free" | "paid",
              priceInr: test.price_inr,
            };
          })}
        />
      )}
    </main>
  );
}
