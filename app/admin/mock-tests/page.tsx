import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateMockTestForm } from "./CreateMockTestForm";
import { MockTestManagementButtons } from "./MockTestManagementButtons";

export default async function MockTestsPage() {
  const supabase = await createClient();
  const [testsResult, subjectsResult, papersResult, groupsResult, categoriesResult] = await Promise.all([
    supabase.from("mock_tests").select("id, paper_id, subject_id, test_scope, title, slug, duration_minutes, status, access_type, price_inr, display_order").order("display_order"),
    supabase.from("subjects").select("id, paper_id, name"),
    supabase.from("papers").select("id, exam_group_id, name, duration_minutes").order("display_order"),
    supabase.from("exam_groups").select("id, exam_id, name").order("display_order"),
    supabase.from("exams").select("id, name").order("display_order"),
  ]);
  const subjects = new Map((subjectsResult.data ?? []).map((item) => [item.id, item]));
  const papers = new Map((papersResult.data ?? []).map((item) => [item.id, item]));
  const groups = new Map((groupsResult.data ?? []).map((item) => [item.id, item]));
  const categories = new Map((categoriesResult.data ?? []).map((item) => [item.id, item]));
  const trail = (paperId: string) => { const paper = papers.get(paperId); const group = paper ? groups.get(paper.exam_group_id) : undefined; return `${categories.get(group?.exam_id ?? "")?.name ?? "Unknown category"} → ${group?.name ?? "Unknown Exam"} → ${paper?.name ?? "Unknown Paper"}`; };
  const tests = testsResult.data ?? [];
  return <main><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Test builder</p><h1 className="mt-2 text-3xl font-black">Mock Tests</h1><p className="mt-2 text-slate-600">Paper-wise mocks use every Subject in a Paper. Subject-wise mocks use one selected Subject.</p></div><CreateMockTestForm categories={(categoriesResult.data ?? []).map((item) => ({ id: item.id, name: item.name }))} exams={(groupsResult.data ?? []).map((item) => ({ id: item.id, categoryId: item.exam_id, name: item.name }))} papers={(papersResult.data ?? []).map((item) => ({ id: item.id, examId: item.exam_group_id, name: item.name, duration: item.duration_minutes }))} subjects={(subjectsResult.data ?? []).map((item) => ({ id: item.id, paperId: item.paper_id, name: item.name }))} /><section className="mt-8 overflow-hidden rounded-2xl border bg-white"><div className="border-b px-6 py-5"><h2 className="font-bold">Existing Mock Tests</h2></div>{testsResult.error ? <p className="p-6 text-red-700">{testsResult.error.message}</p> : tests.length === 0 ? <p className="p-6 text-sm text-slate-600">No Mock Tests yet.</p> : <div className="overflow-x-auto"><table className="min-w-[1000px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Location</th><th className="px-5 py-3">Mock test</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Manage</th></tr></thead><tbody className="divide-y">{tests.map((test) => <tr key={test.id}><td className="px-5 py-4 text-slate-600">{trail(test.paper_id)}</td><td className="px-5 py-4"><p className="font-bold">{test.title}</p><p className="text-xs text-slate-500">{test.duration_minutes} min · {test.access_type === "paid" ? `₹${test.price_inr}` : "Free"}</p></td><td className="px-5 py-4"><p className="font-semibold">{test.test_scope === "paper" ? "Paper-wise" : "Subject-wise"}</p>{test.subject_id && <p className="text-xs text-slate-500">{subjects.get(test.subject_id)?.name}</p>}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize">{test.status}</span></td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><Link href={`/admin/mock-tests/${test.id}/edit`} className="rounded-lg px-2.5 py-1.5 font-bold text-teal-700 hover:bg-teal-50">Edit</Link><MockTestManagementButtons mockTestId={test.id} mockTestTitle={test.title} status={test.status} /></div></td></tr>)}</tbody></table></div>}</section></main>;
}
