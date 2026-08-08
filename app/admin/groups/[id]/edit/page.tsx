import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ExamGroup } from "@/types/group";
import { EditGroupForm } from "./EditGroupForm";

type EditGroupPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditGroupPage({
  params,
}: EditGroupPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [groupResult, examsResult] = await Promise.all([
    supabase
      .from("exam_groups")
      .select(
        "id, exam_id, exam_type, name, slug, description, is_active, display_order, created_at, updated_at"
      )
      .eq("id", id)
      .single(),

    supabase
      .from("exams")
      .select("id, name")
      .order("display_order", { ascending: true }),
  ]);

  if (groupResult.error || !groupResult.data) {
    notFound();
  }

  const group = groupResult.data as ExamGroup;
  const exams = examsResult.data ?? [];

  return (
    <main>
      <Link
        href="/admin/groups"
        className="text-sm font-medium text-gray-600 hover:text-black"
      >
        ← Back to Exams
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold">
          Edit Exam
        </h1>

        <p className="mt-2 text-gray-600">
          Update its classification, details and status.
        </p>
      </div>

      <EditGroupForm group={group} exams={exams} />
    </main>
  );
}
