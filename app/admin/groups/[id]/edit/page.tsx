import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ExamGroup } from "@/types/group";
import { EditGroupForm } from "./EditGroupForm";
import { ExamPaperManager } from "./ExamPaperManager";

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

  const [groupResult, examsResult, papersResult, specializationsResult] = await Promise.all([
    supabase
      .from("exam_groups")
      .select(
        "id, exam_id, name, slug, description, is_active, display_order, created_at, updated_at"
      )
      .eq("id", id)
      .single(),

    supabase
      .from("exams")
      .select("id, name")
      .order("display_order", { ascending: true }),

    supabase
      .from("papers")
      .select("id, specialization_id, name, slug, duration_minutes, question_count, is_active, display_order")
      .eq("exam_group_id", id)
      .order("display_order", { ascending: true }),

    supabase
      .from("exam_specializations")
      .select("id, exam_group_id, name, slug, is_active, display_order")
      .eq("exam_group_id", id)
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
          Set up Specialisations and their Papers from this one Exam workspace.
        </p>
      </div>

      <EditGroupForm group={group} exams={exams} />

      <ExamPaperManager
        examId={group.id}
        examName={group.name}
        specializations={(specializationsResult.data ?? []).map((item) => ({ id: item.id, name: item.name, slug: item.slug, isActive: item.is_active, displayOrder: item.display_order }))}
        papers={(papersResult.data ?? []).map((paper) => ({
          id: paper.id,
          specializationId: paper.specialization_id,
          name: paper.name,
          slug: paper.slug,
          durationMinutes: paper.duration_minutes,
          questionCount: paper.question_count,
          isActive: paper.is_active,
        }))}
      />
    </main>
  );
}
