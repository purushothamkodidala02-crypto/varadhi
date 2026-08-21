import Link from "next/link";
import { notFound } from "next/navigation";
import { EntitySeoForm } from "@/components/admin/EntitySeoForm";
import { createClient } from "@/lib/supabase/server";
import { PaperForm } from "../../PaperForm";

export default async function EditPaperPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fromExam?: string }> }) {
  const { id } = await params;
  const { fromExam } = await searchParams;
  const supabase = await createClient();
  const [paperResult, groupsResult, categoriesResult, specializationsResult] = await Promise.all([
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, slug, description, seo_title, seo_description, duration_minutes, question_count, default_correct_marks, default_negative_marks, is_active, display_order").eq("id", id).maybeSingle(),
    supabase.from("exam_groups").select("id, exam_id, name").order("display_order"),
    supabase.from("exams").select("id, name"),
    supabase.from("exam_specializations").select("id, exam_group_id, name").order("display_order"),
  ]);
  if (!paperResult.data) notFound();
  const paper = paperResult.data;
  const groups = groupsResult.data ?? [];
  const categories = new Map((categoriesResult.data ?? []).map((item) => [item.id, item.name]));
  const parentExam = groups.find((group) => group.id === paper.exam_group_id);
  const cameFromExam = fromExam === paper.exam_group_id;
  const openKey = paper.specialization_id ?? "direct";
  const backHref = cameFromExam ? `/admin/groups/${paper.exam_group_id}/edit?open=${openKey}#${openKey === "direct" ? "direct-papers" : `specialization-${openKey}`}` : "/admin/papers";
  const backLabel = cameFromExam ? `← Back to ${parentExam?.name ?? "Exam"}` : "← Back to Papers";
  return (
    <main>
      <Link href={backHref} className="text-sm font-semibold text-teal-700 hover:underline">{backLabel}</Link>
      <h1 className="mt-5 text-3xl font-black">Edit Paper</h1>
      <PaperForm paper={paper} exams={groups.map((group) => ({ id: group.id, label: `${categories.get(group.exam_id) ?? "Unknown category"} → ${group.name}` }))} specializations={(specializationsResult.data ?? []).map((item) => ({ id: item.id, examId: item.exam_group_id, name: item.name }))} />
      <EntitySeoForm entityType="paper" entityId={paper.id} title={paper.seo_title} description={paper.seo_description} titlePlaceholder={`${parentExam?.name ?? "Exam"} ${paper.name} Mock Tests`} descriptionPlaceholder={`Take free ${paper.name} mock tests with timed practice and answer review.`} />
    </main>
  );
}
