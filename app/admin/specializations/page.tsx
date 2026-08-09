import { createClient } from "@/lib/supabase/server";
import { ExistingSpecializationsTable } from "./ExistingSpecializationsTable";
import { SpecializationForm } from "./SpecializationForm";

export default async function SpecializationsPage() {
  const supabase = await createClient();
  const [specializationsResult, examsResult, categoriesResult] = await Promise.all([
    supabase.from("exam_specializations").select("id, exam_group_id, name, slug, is_active, display_order").order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name, display_order").order("display_order"),
    supabase.from("exams").select("id, name").order("display_order"),
  ]);
  const categories = new Map((categoriesResult.data ?? []).map((item) => [item.id, item.name]));
  const exams = (examsResult.data ?? []).map((item) => ({ id: item.id, label: `${categories.get(item.exam_id) ?? "Unknown category"} → ${item.name}` }));
  return <main><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Exam structure</p><h1 className="mt-2 text-3xl font-black">Specialisations</h1><p className="mt-2 text-slate-600">Add branches only for Exams that need them, such as AEE Civil Engineering or AEE Electrical Engineering.</p></div><SpecializationForm exams={exams} />{specializationsResult.error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{specializationsResult.error.message}</p> : <ExistingSpecializationsTable exams={exams} specializations={(specializationsResult.data ?? []).map((item) => ({ id: item.id, examId: item.exam_group_id, name: item.name, slug: item.slug, isActive: item.is_active }))} />}</main>;
}
