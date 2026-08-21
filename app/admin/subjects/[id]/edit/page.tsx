import Link from "next/link";
import { notFound } from "next/navigation";
import { EntitySeoForm } from "@/components/admin/EntitySeoForm";
import { createClient } from "@/lib/supabase/server";
import type { Subject } from "@/types/subject";
import { EditSubjectForm } from "./EditSubjectForm";

export default async function EditSubjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fromCategory?: string; fromExam?: string; fromSpecialization?: string; fromPaper?: string }> }) {
  const { id } = await params;
  const context = await searchParams;
  const supabase = await createClient();
  const [subjectResult, papersResult, groupsResult, categoriesResult, specializationsResult] = await Promise.all([
    supabase.from("subjects").select("id, paper_id, name, slug, description, seo_title, seo_description, content_language_mode, is_active, display_order, created_at, updated_at").eq("id", id).maybeSingle(),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name").order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name"),
    supabase.from("exams").select("id, name"),
    supabase.from("exam_specializations").select("id, name"),
  ]);
  if (!subjectResult.data) notFound();
  const subject = subjectResult.data;
  const papers = papersResult.data ?? [];
  const groups = new Map((groupsResult.data ?? []).map((item) => [item.id, item]));
  const categories = new Map((categoriesResult.data ?? []).map((item) => [item.id, item.name]));
  const specializations = new Map((specializationsResult.data ?? []).map((item) => [item.id, item.name]));
  const subjectPaper = papers.find((paper) => paper.id === subject.paper_id);
  const subjectExam = subjectPaper ? groups.get(subjectPaper.exam_group_id) : undefined;
  const validReturnContext = context.fromCategory === subjectExam?.exam_id && context.fromExam === subjectPaper?.exam_group_id && context.fromPaper === subject.paper_id && (context.fromSpecialization ?? "") === (subjectPaper?.specialization_id ?? "");
  const backHref = validReturnContext ? `/admin/subjects?category=${context.fromCategory}&exam=${context.fromExam}&specialization=${context.fromSpecialization ?? ""}&paper=${context.fromPaper}` : "/admin/subjects";
  const backLabel = validReturnContext ? "← Back to selected Subjects" : "← Back to Subjects";
  return (
    <main>
      <Link href={backHref} className="text-sm font-semibold text-teal-700 hover:underline">{backLabel}</Link>
      <h1 className="mt-5 text-3xl font-black">Edit Subject</h1>
      <EditSubjectForm subject={subject as Subject} papers={papers.map((paper) => { const group = groups.get(paper.exam_group_id); return { id: paper.id, label: `${categories.get(group?.exam_id ?? "") ?? "Unknown category"} → ${group?.name ?? "Unknown Exam"}${paper.specialization_id ? ` → ${specializations.get(paper.specialization_id) ?? "Unknown Specialisation"}` : ""} → ${paper.name}` }; })} />
      <EntitySeoForm entityType="subject" entityId={subject.id} title={subject.seo_title} description={subject.seo_description} titlePlaceholder={`${subject.name} Mock Tests for ${subjectExam?.name ?? "Exam"}`} descriptionPlaceholder={`Practise free ${subject.name} mock tests with timed questions and answer review.`} />
    </main>
  );
}
