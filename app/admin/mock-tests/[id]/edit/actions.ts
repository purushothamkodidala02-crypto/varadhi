"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";
import { buildMockTestTitle } from "@/lib/exam-catalog";
import { PUBLIC_SLUG_PATTERN } from "@/lib/public-urls";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { createClient } from "@/lib/supabase/server";
import type { MockTestScope, MockTestStatus } from "@/types/mock-test";

export type UpdateMockTestState = { success: boolean; message: string };

export async function updateMockTest(mockTestId: string, _previous: UpdateMockTestState, formData: FormData): Promise<UpdateMockTestState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, message: "You are not authorized to update mock tests." };
  const { data: current } = await supabase.from("mock_tests").select("status, series_number, slug").eq("id", mockTestId).maybeSingle();
  if (!current) return { success: false, message: "Mock test not found." };
  if (current.status !== "draft") return { success: false, message: "Only draft Mock Tests can be edited. Archive a published test, then restore it as a draft before changing it." };

  const paperId = String(formData.get("paper_id") ?? "").trim();
  const scope = String(formData.get("test_scope") ?? "paper") as MockTestScope;
  const subjectId = String(formData.get("subject_id") ?? "").trim() || null;
  const duration = Number(formData.get("duration_minutes") ?? 0);
  const status = String(formData.get("status") ?? "draft") as MockTestStatus;
  const slug = String(formData.get("slug") ?? current.slug).trim().toLowerCase();
  if (!paperId || !Number.isInteger(duration) || duration <= 0) return { success: false, message: "Choose a paper and enter a valid duration." };
  if ((scope !== "paper" && scope !== "subject") || (scope === "subject" && !subjectId) || status !== "draft") return { success: false, message: "Check the mock type and draft status." };
  if (!PUBLIC_SLUG_PATTERN.test(slug) || ["attempt", "subject", "specialization", "opengraph-image"].includes(slug)) return { success: false, message: "Enter a URL slug using lowercase letters, numbers and single hyphens." };

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
    published_at: null,
    access_type: "free",
    price_inr: null,
  }).eq("id", mockTestId);
  if (error?.code === "23505") return { success: false, message: "That paper already has this mock-test number." };
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/mock-tests");
  revalidatePath(`/admin/mock-tests/${mockTestId}/edit`);
  revalidatePath("/mock-tests");
  revalidatePath(`/mock-tests/${mockTestId}`);
  revalidatePath("/");
  revalidateTag(PUBLIC_CATALOG_TAG, "max");
  return { success: true, message: `${title} was updated.` };
}
