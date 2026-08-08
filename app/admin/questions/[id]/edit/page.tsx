import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/types/question";
import { EditQuestionForm } from "./EditQuestionForm";

type SubjectRecord = {
  id: string;
  exam_group_id: string;
  name: string;
  display_order: number;
};

type GroupRecord = { id: string; exam_id: string; name: string; display_order: number };
type ExamRecord = { id: string; name: string };

export default async function EditQuestionPage({ params }: PageProps<"/admin/questions/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();

  const [questionResult, subjectsResult, groupsResult, examsResult] = await Promise.all([
    supabase.from("questions").select("id, subject_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, image_url, source_reference, is_active, created_at, updated_at").eq("id", id).single(),
    supabase.from("subjects").select("id, exam_group_id, name, display_order").order("display_order", { ascending: true }),
    supabase.from("exam_groups").select("id, exam_id, name, display_order").order("display_order", { ascending: true }),
    supabase.from("exams").select("id, name"),
  ]);

  if (questionResult.error || !questionResult.data) notFound();

  const groups = (groupsResult.data ?? []) as GroupRecord[];
  const exams = (examsResult.data ?? []) as ExamRecord[];
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const examMap = new Map(exams.map((exam) => [exam.id, exam]));
  const subjects = ((subjectsResult.data ?? []) as SubjectRecord[])
    .map((subject) => {
      const group = groupMap.get(subject.exam_group_id);
      return {
        id: subject.id,
        groupOrder: group?.display_order ?? 999,
        subjectOrder: subject.display_order,
        label: `${examMap.get(group?.exam_id ?? "")?.name ?? "Unknown exam"} — ${group?.name ?? "Unknown entry"} — ${subject.name}`,
      };
    })
    .sort((first, second) => first.groupOrder - second.groupOrder || first.subjectOrder - second.subjectOrder || first.label.localeCompare(second.label))
    .map(({ id, label }) => ({ id, label }));

  return (
    <main>
      <Link href="/admin/questions" className="text-sm font-medium text-gray-600 hover:text-black">← Back to Questions</Link>
      <div className="mt-6">
        <h1 className="text-3xl font-bold">Edit Question</h1>
        <p className="mt-2 text-gray-600">Update the Question, answer details, and active status.</p>
      </div>
      <EditQuestionForm question={questionResult.data as Question} subjects={subjects} />
    </main>
  );
}
