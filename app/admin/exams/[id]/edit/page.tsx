import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Exam } from "@/types/exam";
import { EditExamForm } from "./EditExamForm";

type EditExamPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditExamPage({
  params,
}: EditExamPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exams")
    .select(
      "id, name, slug, description, is_active, display_order, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const exam = data as Exam;

  return (
    <main>
      <Link
        href="/admin/exams"
        className="text-sm font-medium text-gray-600 hover:text-black"
      >
        ← Back to Exams
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold">Edit Exam</h1>

        <p className="mt-2 text-gray-600">
          Update the selected exam’s details and status.
        </p>
      </div>

      <EditExamForm exam={exam} />
    </main>
  );
}