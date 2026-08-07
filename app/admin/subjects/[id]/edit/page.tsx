import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Subject } from "@/types/subject";
import { EditSubjectForm } from "./EditSubjectForm";

type EditSubjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type GroupRecord = {
  id: string;
  exam_id: string;
  name: string;
};

type ExamRecord = {
  id: string;
  name: string;
};

export default async function EditSubjectPage({
  params,
}: EditSubjectPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [subjectResult, groupsResult, examsResult] =
    await Promise.all([
      supabase
        .from("subjects")
        .select(
          "id, exam_group_id, name, slug, description, is_active, display_order, created_at, updated_at"
        )
        .eq("id", id)
        .single(),

      supabase
        .from("exam_groups")
        .select("id, exam_id, name")
        .order("display_order", { ascending: true }),

      supabase
        .from("exams")
        .select("id, name"),
    ]);

  if (subjectResult.error || !subjectResult.data) {
    notFound();
  }

  const subject = subjectResult.data as Subject;
  const groups = (groupsResult.data ?? []) as GroupRecord[];
  const exams = (examsResult.data ?? []) as ExamRecord[];

  const examMap = new Map(
    exams.map((exam) => [exam.id, exam])
  );

  const groupOptions = groups.map((group) => ({
    id: group.id,
    label: `${examMap.get(group.exam_id)?.name ?? "Unknown exam"} — ${group.name}`,
  }));

  return (
    <main>
      <Link
        href="/admin/subjects"
        className="text-sm font-medium text-gray-600 hover:text-black"
      >
        ← Back to Subjects
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold">Edit Subject</h1>

        <p className="mt-2 text-gray-600">
          Update the selected Subject’s details and status.
        </p>
      </div>

      <EditSubjectForm
        subject={subject}
        groups={groupOptions}
      />
    </main>
  );
}