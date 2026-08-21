import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpecializationForm } from "../../SpecializationForm";

export default async function EditSpecializationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [specializationResult, examsResult] = await Promise.all([
    supabase.from("exam_specializations").select("id, exam_group_id, name, slug, description, seo_title, seo_description, display_order, is_active").eq("id", id).maybeSingle(),
    supabase.from("exam_groups").select("id, name").order("name"),
  ]);
  if (!specializationResult.data) notFound();
  return (
    <main>
      <Link href={`/admin/groups/${specializationResult.data.exam_group_id}/edit`} className="text-sm font-bold text-teal-700 hover:underline">← Back to Exam</Link>
      <h1 className="mt-6 text-3xl font-black">Edit Specialisation</h1>
      <p className="mt-2 text-slate-600">Update its student details, permanent URL and Google search appearance.</p>
      <SpecializationForm exams={(examsResult.data ?? []).map((exam) => ({ id: exam.id, label: exam.name }))} specialization={specializationResult.data} />
    </main>
  );
}
