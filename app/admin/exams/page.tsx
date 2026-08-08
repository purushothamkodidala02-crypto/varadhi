import { createClient } from "@/lib/supabase/server";
import type { Exam } from "@/types/exam";
import { CreateExamForm } from "./CreateExamForm";
import { ExistingExamCategoriesTable } from "./ExistingExamCategoriesTable";

export default async function AdminExamsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exams")
    .select("id, name, slug, description, is_active, display_order, created_at, updated_at")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  const exams = (data ?? []) as Exam[];

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">Exam Categories</h1>
        <p className="mt-2 text-gray-600">
          Create and manage categories such as TGPSC, TET, or DSC.
        </p>
      </div>

      <CreateExamForm />

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">Unable to load Exam Categories</p>
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-lg font-semibold">No Exam Categories added yet</h2>
        </div>
      ) : (
        <ExistingExamCategoriesTable exams={exams} />
      )}
    </main>
  );
}
