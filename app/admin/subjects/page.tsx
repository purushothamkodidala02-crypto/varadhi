import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateSubjectForm } from "./CreateSubjectForm";
import { DeleteSubjectButton } from "./DeleteSubjectButton";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const [subjectsResult, papersResult, groupsResult, categoriesResult] = await Promise.all([
    supabase.from("subjects").select("id, paper_id, name, slug, description, is_active, display_order").order("display_order"),
    supabase.from("papers").select("id, exam_group_id, name, display_order").order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name").order("display_order"),
    supabase.from("exams").select("id, name").order("display_order"),
  ]);
  const categories = new Map((categoriesResult.data ?? []).map((item) => [item.id, item.name]));
  const groups = new Map((groupsResult.data ?? []).map((item) => [item.id, item]));
  const papers = new Map((papersResult.data ?? []).map((item) => [item.id, item]));
  const paperLabel = (paperId: string) => { const paper = papers.get(paperId); const group = paper ? groups.get(paper.exam_group_id) : undefined; return `${group ? categories.get(group.exam_id) ?? "Unknown category" : "Unknown category"} -> ${group?.name ?? "Unknown Exam"} -> ${paper?.name ?? "Unknown Paper"}`; };

  return <main><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Exam structure</p><h1 className="mt-2 text-3xl font-black">Subjects</h1><p className="mt-2 text-slate-600">Choose the Category, Exam, and Paper first, then add all of its Subjects.</p></div><CreateSubjectForm categories={categoriesResult.data ?? []} exams={groupsResult.data ?? []} papers={papersResult.data ?? []} />{subjectsResult.error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{subjectsResult.error.message}</p> : <section className="mt-8 overflow-hidden rounded-2xl border bg-white"><div className="border-b px-6 py-5"><h2 className="font-bold">Existing Subjects</h2></div>{(subjectsResult.data ?? []).length === 0 ? <p className="p-6 text-sm text-slate-600">No Subjects yet. Add an Exam and Paper first.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Paper</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y">{(subjectsResult.data ?? []).map((subject) => <tr key={subject.id}><td className="px-5 py-4 text-slate-600">{paperLabel(subject.paper_id)}</td><td className="px-5 py-4"><p className="font-bold">{subject.name}</p><p className="text-xs text-slate-500">{subject.slug}</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${subject.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{subject.is_active ? "Active" : "Inactive"}</span></td><td className="px-5 py-4 text-right"><span className="inline-flex items-center gap-4"><Link href={`/admin/subjects/${subject.id}/edit`} className="font-semibold text-teal-700 hover:underline">Edit</Link><DeleteSubjectButton subjectId={subject.id} subjectName={subject.name} /></span></td></tr>)}</tbody></table></div>}</section>}</main>;
}
