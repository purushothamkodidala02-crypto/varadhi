"use server";

import { revalidatePath } from "next/cache";
import { buildMockTestTitle, toCatalogSlug } from "@/lib/exam-catalog";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { createClient } from "@/lib/supabase/server";
import type { MockTestAccessType, MockTestScope, MockTestStatus } from "@/types/mock-test";

export type UpdateMockTestState = { success: boolean; message: string };

export async function updateMockTest(mockTestId: string, _previous: UpdateMockTestState, formData: FormData): Promise<UpdateMockTestState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, message: "You are not authorized to update mock tests." };
  const { data: current } = await supabase.from("mock_tests").select("status, series_number").eq("id", mockTestId).maybeSingle();
  if (!current) return { success: false, message: "Mock test not found." };

  const paperId = String(formData.get("paper_id") ?? "").trim();
  const scope = String(formData.get("test_scope") ?? "paper") as MockTestScope;
  const subjectId = String(formData.get("subject_id") ?? "").trim() || null;
  const duration = Number(formData.get("duration_minutes") ?? 0);
  const status = String(formData.get("status") ?? "draft") as MockTestStatus;
  const accessType = String(formData.get("access_type") ?? "free") as MockTestAccessType;
  const priceValue = String(formData.get("price_inr") ?? "").trim();
  const price = priceValue ? Number(priceValue) : null;
  if (!paperId || !Number.isInteger(duration) || duration <= 0) return { success: false, message: "Choose a paper and enter a valid duration." };
  if ((scope !== "paper" && scope !== "subject") || (scope === "subject" && !subjectId) || !["draft", "published", "archived"].includes(status) || !["free", "paid"].includes(accessType) || (accessType === "paid" && (!price || price <= 0))) return { success: false, message: "Check the mock type, access and status." };

  const paperResult = await supabase.from("papers").select("id, exam_group_id, specialization_id, name, display_order").eq("id", paperId).maybeSingle();
  const paper = paperResult.data;
  if (!paper) return { success: false, message: "The selected paper no longer exists." };
  const [groupResult, siblingPapersResult, subjectResult] = await Promise.all([
    supabase.from("exam_groups").select("id, exam_id, name").eq("id", paper.exam_group_id).maybeSingle(),
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, display_order").eq("exam_group_id", paper.exam_group_id),
    subjectId ? supabase.from("subjects").select("id, paper_id, name").eq("id", subjectId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const group = groupResult.data;
  const subject = subjectResult.data;
  if (!group || (scope === "subject" && (!subject || subject.paper_id !== paper.id))) return { success: false, message: "The selected subject must belong to the selected paper." };
  const categoryResult = await supabase.from("exams").select("id, state_id").eq("id", group.exam_id).maybeSingle();
  const stateResult = categoryResult.data ? await supabase.from("exam_states").select("id, code").eq("id", categoryResult.data.state_id).maybeSingle() : { data: null };
  if (!categoryResult.data || !stateResult.data) return { success: false, message: "The exam location is incomplete. Fix it in Exam Structure first." };
  const paperNumber = buildPaperDisplayMap((siblingPapersResult.data ?? []) as OrderedPaper[]).get(paper.id)?.number ?? 1;
  const seriesNumber = Number(current.series_number ?? 1);
  const title = buildMockTestTitle({ stateCode: stateResult.data.code, examName: group.name, paperNumber, subjectName: subject?.name, seriesNumber });
  const slug = toCatalogSlug(title);

  if (status === "published") {
    const { data: assignments, error: assignmentsError } = await supabase.from("mock_test_questions").select("question_id, marks, negative_marks").eq("mock_test_id", mockTestId);
    if (assignmentsError) return { success: false, message: assignmentsError.message };
    const questionIds = (assignments ?? []).map((assignment) => assignment.question_id);
    if (!questionIds.length) return { success: false, message: "Add at least one question before publishing." };
    if ((assignments ?? []).some((assignment) => Number(assignment.marks) <= 0 || Number(assignment.negative_marks) < 0)) return { success: false, message: "Every assigned question needs valid marks before publishing." };
    const { count: activeCount, error: activeQuestionsError } = await supabase.from("questions").select("id", { count: "exact", head: true }).in("id", questionIds).eq("is_active", true);
    if (activeQuestionsError) return { success: false, message: activeQuestionsError.message };
    if (!activeCount) return { success: false, message: "Activate at least one assigned question before publishing." };
  }

  const { error } = await supabase.from("mock_tests").update({
    paper_id: paperId,
    test_scope: scope,
    subject_id: scope === "subject" ? subjectId : null,
    title,
    slug,
    description: String(formData.get("description") ?? "").trim() || null,
    instructions: String(formData.get("instructions") ?? "").trim() || null,
    duration_minutes: duration,
    display_order: seriesNumber,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    access_type: accessType,
    price_inr: accessType === "paid" ? price : null,
  }).eq("id", mockTestId);
  if (error?.code === "23505") return { success: false, message: "That paper already has this mock-test number." };
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/mock-tests");
  revalidatePath(`/admin/mock-tests/${mockTestId}/edit`);
  revalidatePath("/mock-tests");
  revalidatePath(`/mock-tests/${mockTestId}`);
  revalidatePath("/");
  return { success: true, message: `${title} was updated.` };
}
