"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PaperActionState = { success: boolean; message: string };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? { supabase, error: null } : { supabase, error: "You are not authorized to manage Papers." };
}

function readPaper(formData: FormData) {
  const examGroupId = String(formData.get("exam_group_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const durationValue = String(formData.get("duration_minutes") ?? "").trim();
  const questionCountValue = String(formData.get("question_count") ?? "").trim();
  const correctValue = String(formData.get("default_correct_marks") ?? "1").trim();
  const negativeValue = String(formData.get("default_negative_marks") ?? "0").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const durationMinutes = durationValue ? Number(durationValue) : null;
  const questionCount = questionCountValue ? Number(questionCountValue) : null;
  const defaultCorrectMarks = Number(correctValue);
  const defaultNegativeMarks = Number(negativeValue);

  if (!examGroupId || !name) return { error: "Choose an Exam and enter a Paper name." };
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { error: "Slug can contain only lowercase letters, numbers and hyphens." };
  if ((durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) || (questionCount !== null && (!Number.isInteger(questionCount) || questionCount <= 0))) return { error: "Duration and question count must be positive whole numbers." };
  if (!Number.isFinite(defaultCorrectMarks) || defaultCorrectMarks <= 0 || !Number.isFinite(defaultNegativeMarks) || defaultNegativeMarks < 0 || !Number.isInteger(displayOrder) || displayOrder < 0) return { error: "Check correct marks, negative marks, and display order." };

  return { value: { exam_group_id: examGroupId, name, slug, description: String(formData.get("description") ?? "").trim() || null, duration_minutes: durationMinutes, question_count: questionCount, default_correct_marks: defaultCorrectMarks, default_negative_marks: defaultNegativeMarks, display_order: displayOrder, is_active: formData.get("is_active") === "on" } };
}

export async function createPaper(_previous: PaperActionState, formData: FormData): Promise<PaperActionState> {
  const result = await requireAdmin();
  if (result.error) return { success: false, message: result.error };
  const parsed = readPaper(formData);
  if (parsed.error || !parsed.value) return { success: false, message: parsed.error ?? "Check the Paper details." };
  const { data: group } = await result.supabase.from("exam_groups").select("id").eq("id", parsed.value.exam_group_id).maybeSingle();
  if (!group) return { success: false, message: "The selected Exam could not be found." };
  const { error } = await result.supabase.from("papers").insert(parsed.value);
  if (error?.code === "23505") return { success: false, message: "A Paper with this slug already exists under the selected Exam." };
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/papers"); revalidatePath("/admin/subjects"); revalidatePath("/admin/mock-tests"); revalidatePath("/admin/questions");
  return { success: true, message: "Paper created successfully." };
}

export async function updatePaper(_previous: PaperActionState, formData: FormData): Promise<PaperActionState> {
  const result = await requireAdmin();
  if (result.error) return { success: false, message: result.error };
  const paperId = String(formData.get("paper_id") ?? "").trim();
  const parsed = readPaper(formData);
  if (!paperId || parsed.error || !parsed.value) return { success: false, message: parsed.error ?? "Paper not found." };
  const { error } = await result.supabase.from("papers").update(parsed.value).eq("id", paperId);
  if (error?.code === "23505") return { success: false, message: "A Paper with this slug already exists under the selected Exam." };
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/papers"); revalidatePath(`/admin/papers/${paperId}/edit`); revalidatePath("/admin/subjects"); revalidatePath("/admin/mock-tests"); revalidatePath("/admin/questions");
  return { success: true, message: "Paper updated successfully." };
}

export async function deletePaper(paperId: string): Promise<PaperActionState> {
  const result = await requireAdmin();
  if (result.error) return { success: false, message: result.error };
  const { count, error: countError } = await result.supabase.from("subjects").select("id", { count: "exact", head: true }).eq("paper_id", paperId);
  if (countError) return { success: false, message: countError.message };
  if ((count ?? 0) > 0) return { success: false, message: "This Paper has Subjects. Deactivate it instead." };
  const { error } = await result.supabase.from("papers").delete().eq("id", paperId);
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/papers");
  return { success: true, message: "Paper deleted." };
}
