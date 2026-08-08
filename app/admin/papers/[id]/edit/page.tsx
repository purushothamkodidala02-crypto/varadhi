import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaperForm } from "../../PaperForm";

export default async function EditPaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const [paperResult, groupsResult, categoriesResult] = await Promise.all([supabase.from("papers").select("id, exam_group_id, name, slug, description, duration_minutes, question_count, default_negative_marks, is_active, display_order").eq("id", id).maybeSingle(), supabase.from("exam_groups").select("id, exam_id, name").order("display_order"), supabase.from("exams").select("id, name")]);
  if (!paperResult.data) notFound();
  const categories = new Map((categoriesResult.data ?? []).map((item) => [item.id, item.name]));
  return <main><Link href="/admin/papers" className="text-sm font-semibold text-teal-700 hover:underline">← Back to Papers</Link><h1 className="mt-5 text-3xl font-black">Edit Paper</h1><PaperForm paper={paperResult.data} exams={(groupsResult.data ?? []).map((group) => ({ id: group.id, label: `${categories.get(group.exam_id) ?? "Unknown category"} → ${group.name}` }))} /></main>;
}
