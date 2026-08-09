"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateSubjectState = { success: boolean; message: string };

export async function updateSubject(subjectId: string, _previous: UpdateSubjectState, formData: FormData): Promise<UpdateSubjectState> {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, message: "You are not authorized to update Subjects." };
  const paperId = String(formData.get("paper_id") ?? "").trim(); const name = String(formData.get("name") ?? "").trim(); const slug = String(formData.get("slug") ?? "").trim().toLowerCase(); const displayOrder = Number(formData.get("display_order") ?? 0); const languageMode = String(formData.get("content_language_mode") ?? "");
  if (!paperId || !name) return { success: false, message: "Choose a Paper and enter a Subject name." };
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { success: false, message: "Slug can contain only lowercase letters, numbers and hyphens." };
  if (!["bilingual", "english", "telugu"].includes(languageMode)) return { success: false, message: "Choose a valid question language." };
  if (!Number.isInteger(displayOrder) || displayOrder < 0) return { success: false, message: "Display order must be zero or a positive number." };
  const { data: paper } = await supabase.from("papers").select("id").eq("id", paperId).maybeSingle();
  if (!paper) return { success: false, message: "The selected Paper could not be found." };
  const { data: existingSubjects, error: existingSubjectsError } = await supabase.from("subjects").select("id, name").eq("paper_id", paperId).neq("id", subjectId);
  if (existingSubjectsError) return { success: false, message: existingSubjectsError.message };
  if ((existingSubjects ?? []).some((subject) => subject.name.trim().toLowerCase() === name.toLowerCase())) return { success: false, message: `The Subject "${name}" already exists in this Paper. Subject names are not case-sensitive.` };
  const { error } = await supabase.from("subjects").update({ paper_id: paperId, name, slug, description: String(formData.get("description") ?? "").trim() || null, content_language_mode: languageMode, is_active: formData.get("is_active") === "on", display_order: displayOrder }).eq("id", subjectId);
  if (error?.code === "23505") return { success: false, message: "A Subject with this slug already exists in the selected Paper." };
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/subjects"); revalidatePath(`/admin/subjects/${subjectId}/edit`); revalidatePath("/admin/questions"); revalidatePath("/admin/mock-tests");
  return { success: true, message: "Subject updated successfully." };
}
