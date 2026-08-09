import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditSubjectForm } from "./EditSubjectForm";
import type { Subject } from "@/types/subject";

export default async function EditSubjectPage({ params }: PageProps<"/admin/subjects/[id]/edit">) {
  const { id } = await params; const supabase = await createClient();
  const [subjectResult, papersResult, groupsResult, categoriesResult, specializationsResult] = await Promise.all([
    supabase.from("subjects").select("id, paper_id, name, slug, description, content_language_mode, is_active, display_order, created_at, updated_at").eq("id", id).maybeSingle(),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name").order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name"), supabase.from("exams").select("id, name"), supabase.from("exam_specializations").select("id, name"),
  ]);
  if (!subjectResult.data) notFound(); const categories = new Map((categoriesResult.data ?? []).map((item) => [item.id, item.name])); const groups = new Map((groupsResult.data ?? []).map((item) => [item.id, item])); const specializations = new Map((specializationsResult.data ?? []).map((item) => [item.id, item.name]));
  return <main><Link href="/admin/subjects" className="text-sm font-semibold text-teal-700 hover:underline">← Back to Subjects</Link><h1 className="mt-5 text-3xl font-black">Edit Subject</h1><EditSubjectForm subject={subjectResult.data as Subject} papers={(papersResult.data ?? []).map((paper) => { const group = groups.get(paper.exam_group_id); return { id: paper.id, label: `${categories.get(group?.exam_id ?? "") ?? "Unknown category"} → ${group?.name ?? "Unknown Exam"}${paper.specialization_id ? ` → ${specializations.get(paper.specialization_id) ?? "Unknown Specialisation"}` : ""} → ${paper.name}` }; })} /></main>;
}
