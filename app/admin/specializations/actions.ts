"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SpecializationActionState = { success: boolean; message: string };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? { supabase, error: null } : { supabase, error: "You are not authorized to manage Specialisations." };
}

function readSpecialization(formData: FormData) {
  const examGroupId = String(formData.get("exam_group_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (!examGroupId || !name) return { error: "Choose an Exam and enter the Specialisation name." };
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { error: "Slug can contain only lowercase letters, numbers and hyphens." };
  if (!Number.isInteger(displayOrder) || displayOrder < 0) return { error: "Display order must be zero or a positive number." };
  return { value: { exam_group_id: examGroupId, name, slug, description: String(formData.get("description") ?? "").trim() || null, display_order: displayOrder, is_active: formData.get("is_active") === "on" } };
}

export async function createSpecialization(_previous: SpecializationActionState, formData: FormData): Promise<SpecializationActionState> {
  const result = await requireAdmin();
  if (result.error) return { success: false, message: result.error };
  const parsed = readSpecialization(formData);
  if (parsed.error || !parsed.value) return { success: false, message: parsed.error ?? "Check the Specialisation details." };
  const { data: exam } = await result.supabase.from("exam_groups").select("id").eq("id", parsed.value.exam_group_id).maybeSingle();
  if (!exam) return { success: false, message: "The selected Exam could not be found." };
  const { data: existing } = await result.supabase.from("exam_specializations").select("name").eq("exam_group_id", parsed.value.exam_group_id);
  if ((existing ?? []).some((item) => item.name.trim().toLowerCase() === parsed.value!.name.toLowerCase())) return { success: false, message: `"${parsed.value.name}" already exists for this Exam.` };
  const { error } = await result.supabase.from("exam_specializations").insert(parsed.value);
  if (error?.code === "23505") return { success: false, message: "This Specialisation already exists for the selected Exam." };
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/groups"); revalidatePath("/admin/exams"); revalidatePath(`/admin/groups/${parsed.value.exam_group_id}/edit`); revalidatePath("/admin/papers"); revalidatePath("/mock-tests");
  return { success: true, message: "Specialisation created successfully." };
}

export async function updateSpecialization(_previous: SpecializationActionState, formData: FormData): Promise<SpecializationActionState> {
  const result = await requireAdmin();
  if (result.error) return { success: false, message: result.error };
  const specializationId = String(formData.get("specialization_id") ?? "").trim();
  const parsed = readSpecialization(formData);
  if (!specializationId || parsed.error || !parsed.value) return { success: false, message: parsed.error ?? "Specialisation not found." };
  const { data: existing } = await result.supabase.from("exam_specializations").select("id, name").eq("exam_group_id", parsed.value.exam_group_id).neq("id", specializationId);
  if ((existing ?? []).some((item) => item.name.trim().toLowerCase() === parsed.value!.name.toLowerCase())) return { success: false, message: `"${parsed.value.name}" already exists for this Exam.` };
  const { error } = await result.supabase.from("exam_specializations").update(parsed.value).eq("id", specializationId);
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/groups"); revalidatePath("/admin/exams"); revalidatePath(`/admin/groups/${parsed.value.exam_group_id}/edit`); revalidatePath("/admin/papers"); revalidatePath("/mock-tests");
  return { success: true, message: "Specialisation updated successfully." };
}

export async function deleteSpecialization(specializationId: string): Promise<SpecializationActionState> {
  const result = await requireAdmin();
  if (result.error) return { success: false, message: result.error };
  const { data: specialization, error: specializationError } = await result.supabase
    .from("exam_specializations")
    .select("exam_group_id")
    .eq("id", specializationId)
    .maybeSingle();
  if (specializationError || !specialization) return { success: false, message: specializationError?.message ?? "This Specialisation could not be found." };
  const { count, error: countError } = await result.supabase.from("papers").select("id", { count: "exact", head: true }).eq("specialization_id", specializationId);
  if (countError) return { success: false, message: countError.message };
  if ((count ?? 0) > 0) return { success: false, message: "This Specialisation has Papers. Deactivate it instead." };
  const { error } = await result.supabase.from("exam_specializations").delete().eq("id", specializationId);
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/groups"); revalidatePath("/admin/exams"); revalidatePath(`/admin/groups/${specialization.exam_group_id}/edit`); revalidatePath("/admin/papers"); revalidatePath("/mock-tests");
  return { success: true, message: "Specialisation deleted." };
}
