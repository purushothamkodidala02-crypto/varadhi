"use server";

import { revalidatePath } from "next/cache";
import { buildMockTestTitle, toCatalogSlug } from "@/lib/exam-catalog";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { createClient } from "@/lib/supabase/server";
import type { MockTestAccessType, MockTestScope } from "@/types/mock-test";

export type CreateMockTestState = { success: boolean; message: string };

export async function createMockTest(_previous: CreateMockTestState, formData: FormData): Promise<CreateMockTestState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, message: "You are not authorized to create mock tests." };

  const stateId = String(formData.get("state_id") ?? "").trim();
  const categoryId = String(formData.get("exam_id") ?? "").trim();
  const examId = String(formData.get("exam_group_id") ?? "").trim();
  const paperId = String(formData.get("paper_id") ?? "").trim();
  const scope = String(formData.get("test_scope") ?? "paper") as MockTestScope;
  const subjectId = String(formData.get("subject_id") ?? "").trim() || null;
  const duration = Number(formData.get("duration_minutes") ?? 0);
  const accessType = String(formData.get("access_type") ?? "free") as MockTestAccessType;
  const priceValue = String(formData.get("price_inr") ?? "").trim();
  const price = priceValue ? Number(priceValue) : null;
  if (!stateId || !categoryId || !examId || !paperId) return { success: false, message: "Choose the state, board, exam and paper." };
  if (!Number.isInteger(duration) || duration <= 0) return { success: false, message: "Enter a valid duration." };
  if (scope !== "paper" && scope !== "subject") return { success: false, message: "Choose a valid practice coverage." };
  if (scope === "subject" && !subjectId) return { success: false, message: "Choose a subject for a subject-only mock." };
  if (accessType !== "free" && accessType !== "paid") return { success: false, message: "Choose Free or Paid access." };
  if (accessType === "paid" && (!price || price <= 0)) return { success: false, message: "Enter a valid price." };

  const [stateResult, categoryResult, groupResult, paperResult, papersResult, subjectResult] = await Promise.all([
    supabase.from("exam_states").select("id, name, code, slug").eq("id", stateId).maybeSingle(),
    supabase.from("exams").select("id, state_id, name").eq("id", categoryId).maybeSingle(),
    supabase.from("exam_groups").select("id, exam_id, name, slug").eq("id", examId).maybeSingle(),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, display_order").eq("id", paperId).maybeSingle(),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, display_order").eq("exam_group_id", examId),
    subjectId ? supabase.from("subjects").select("id, paper_id, name").eq("id", subjectId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const state = stateResult.data;
  const category = categoryResult.data;
  const group = groupResult.data;
  const paper = paperResult.data;
  const subject = subjectResult.data;
  if (!state || !category || !group || !paper || category.state_id !== state.id || group.exam_id !== category.id || paper.exam_group_id !== group.id || (scope === "subject" && (!subject || subject.paper_id !== paper.id))) {
    return { success: false, message: "The selected state, board, exam, paper and subject do not belong together." };
  }
  const paperNumber = buildPaperDisplayMap((papersResult.data ?? []) as OrderedPaper[]).get(paper.id)?.number ?? Math.max(1, Number(paper.display_order));
  let existingSeriesQuery = supabase.from("mock_tests").select("series_number").eq("paper_id", paperId).eq("test_scope", scope).order("series_number", { ascending: false }).limit(1);
  existingSeriesQuery = scope === "subject" ? existingSeriesQuery.eq("subject_id", subjectId) : existingSeriesQuery.is("subject_id", null);
  const { data: existingSeries, error: seriesError } = await existingSeriesQuery;
  if (seriesError) return { success: false, message: seriesError.message };
  const seriesNumber = Number(existingSeries?.[0]?.series_number ?? 0) + 1;
  const title = buildMockTestTitle({ stateCode: state.code, examName: group.name, paperNumber, subjectName: subject?.name, seriesNumber });
  const slug = toCatalogSlug(title);
  const { error } = await supabase.from("mock_tests").insert({
    paper_id: paperId,
    subject_id: scope === "subject" ? subjectId : null,
    test_scope: scope,
    series_number: seriesNumber,
    title,
    slug,
    description: String(formData.get("description") ?? "").trim() || null,
    instructions: null,
    duration_minutes: duration,
    difficulty: "mixed",
    status: "draft",
    version: 1,
    display_order: seriesNumber,
    published_at: null,
    access_type: accessType,
    price_inr: accessType === "paid" ? price : null,
  });
  if (error?.code === "23505") return { success: false, message: "This series number was just used. Submit again to create the next number." };
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/mock-tests");
  revalidatePath("/mock-tests");
  revalidatePath("/");
  return { success: true, message: `${title} was created as a draft.` };
}
