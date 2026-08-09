import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpecializationForm } from "../../SpecializationForm";

export default async function EditSpecializationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const [specializationResult, examsResult, categoriesResult] = await Promise.all([
    supabase.from("exam_specializations").select("id, exam_group_id, name, slug, description, is_active, display_order").eq("id", id).maybeSingle(),
    supabase.from("exam_groups").select("id, exam_id, name").order("display_order"),
    supabase.from("exams").select("id, name"),
  ]);
  if (!specializationResult.data) notFound();
  const categories = new Map((categoriesResult.data ?? []).map((item) => [item.id, item.name]));
  const exams = (examsResult.data ?? []).map((item) => ({ id: item.id, label: `${categories.get(item.exam_id) ?? "Unknown category"} → ${item.name}` }));
  return <main><Link href="/admin/specializations" className="text-sm font-semibold text-teal-700 hover:underline">← Back to Specialisations</Link><h1 className="mt-5 text-3xl font-black">Edit Specialisation</h1><SpecializationForm exams={exams} specialization={specializationResult.data} /></main>;
}
