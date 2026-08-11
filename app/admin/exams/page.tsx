import { createClient } from "@/lib/supabase/server";
import { ExamStructureWorkspace } from "./ExamStructureWorkspace";

export default async function AdminExamStructurePage() {
  const supabase = await createClient();
  const [
    statesResult,
    categoriesResult,
    examsResult,
    specializationsResult,
    papersResult,
    subjectsResult,
  ] = await Promise.all([
    supabase
      .from("exam_states")
      .select("id, name, code, slug, description, is_active, display_order")
      .order("display_order")
      .order("name"),
    supabase
      .from("exams")
      .select("id, state_id, name, slug, is_active, display_order")
      .order("display_order")
      .order("name"),
    supabase
      .from("exam_groups")
      .select("id, exam_id, name, slug, is_active, display_order")
      .order("display_order")
      .order("name"),
    supabase
      .from("exam_specializations")
      .select("id, exam_group_id, name, is_active, display_order")
      .order("display_order")
      .order("name"),
    supabase
      .from("papers")
      .select("id, exam_group_id, specialization_id, name, is_active, display_order")
      .order("display_order")
      .order("name"),
    supabase
      .from("subjects")
      .select("id, paper_id, name, is_active, display_order")
      .order("display_order")
      .order("name"),
  ]);

  const errors = [
    statesResult.error,
    categoriesResult.error,
    examsResult.error,
    specializationsResult.error,
    papersResult.error,
    subjectsResult.error,
  ].filter(Boolean);
  const categories = categoriesResult.data ?? [];
  const states = statesResult.data ?? [];
  const exams = examsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const subjects = subjectsResult.data ?? [];

  return (
    <main>
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 sm:p-9">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
              State-first structure manager
            </p>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Exam Structure
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Keep Telangana, Andhra Pradesh and Central exams separate, then
              manage boards, Exams, Specialisations, Papers and Subjects.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            <SummaryCount value={states.length} label="States" tone="teal" />
            <SummaryCount value={categories.length} label="Boards" tone="amber" />
            <SummaryCount value={exams.length} label="Exams" tone="amber" />
          </div>
        </div>
      </section>

      {errors.length > 0 && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Some Exam Structure data could not be loaded. {errors[0]?.message}
        </div>
      )}

      <ExamStructureWorkspace
        states={states.map((state) => ({
          id: state.id,
          name: state.name,
          code: state.code,
          slug: state.slug,
          description: state.description,
          isActive: state.is_active,
          displayOrder: state.display_order,
        }))}
        categories={categories.map((category) => ({
          id: category.id,
          stateId: category.state_id,
          name: category.name,
          slug: category.slug,
          isActive: category.is_active,
          displayOrder: category.display_order,
        }))}
        exams={exams.map((exam) => ({
          id: exam.id,
          categoryId: exam.exam_id,
          name: exam.name,
          slug: exam.slug,
          isActive: exam.is_active,
          displayOrder: exam.display_order,
        }))}
        specializations={(specializationsResult.data ?? []).map((item) => ({
          id: item.id,
          examId: item.exam_group_id,
          name: item.name,
          isActive: item.is_active,
        }))}
        papers={papers.map((paper) => ({
          id: paper.id,
          examId: paper.exam_group_id,
          specializationId: paper.specialization_id,
          name: paper.name,
          isActive: paper.is_active,
        }))}
        subjects={subjects.map((subject) => ({
          id: subject.id,
          paperId: subject.paper_id,
          name: subject.name,
          isActive: subject.is_active,
        }))}
      />
    </main>
  );
}

function SummaryCount({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "teal" | "amber" | "slate";
}) {
  const styles = {
    teal: "bg-teal-300/10 text-teal-200",
    amber: "bg-amber-300/10 text-amber-200",
    slate: "bg-white/5 text-slate-300",
  };
  return (
    <div className={`min-w-24 rounded-xl px-3 py-3 ${styles[tone]}`}>
      <strong className="block text-lg text-white">{value}</strong>
      {label}
    </div>
  );
}
