"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";
import { createClient } from "@/lib/supabase/server";
import type { SubjectContentLanguageMode } from "@/types/subject";

export type CreateSubjectState = { success: boolean; message: string };

function subjectSlug(name: string, index: number, used: Set<string>) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `subject-${index + 1}`;
  let slug = base; let suffix = 2;
  while (used.has(slug)) { slug = `${base}-${suffix}`; suffix += 1; }
  used.add(slug); return slug;
}

function readSubjects(value: FormDataEntryValue | null): { subjects?: { name: string; contentLanguageMode: SubjectContentLanguageMode }[]; error?: string } {
  let raw: unknown;
  try { raw = JSON.parse(String(value ?? "[]")); } catch { return { error: "Subject details could not be read. Please try again." }; }
  if (!Array.isArray(raw) || raw.length === 0) return { error: "Add at least one Subject." };
  if (raw.length > 30) return { error: "You can add up to 30 Subjects at one time." };
  const subjects = raw.map((item) => ({
    name: item && typeof item === "object" ? String((item as { name?: unknown }).name ?? "").trim() : "",
    contentLanguageMode: item && typeof item === "object" ? String((item as { contentLanguageMode?: unknown }).contentLanguageMode ?? "bilingual") : "bilingual",
  }));
  if (subjects.some((subject) => !subject.name)) return { error: "Enter a name for every Subject." };
  if (subjects.some((subject) => !["bilingual", "english", "telugu"].includes(subject.contentLanguageMode))) return { error: "Choose a valid language setting for every Subject." };
  if (new Set(subjects.map((subject) => subject.name.toLowerCase())).size !== subjects.length) return { error: "Each Subject needs a different name." };
  return { subjects: subjects as { name: string; contentLanguageMode: SubjectContentLanguageMode }[] };
}

export async function createSubjects(_previous: CreateSubjectState, formData: FormData): Promise<CreateSubjectState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, message: "You are not authorized to create Subjects." };

  const categoryId = String(formData.get("exam_category_id") ?? "").trim();
  const examGroupId = String(formData.get("exam_group_id") ?? "").trim();
  const paperId = String(formData.get("paper_id") ?? "").trim();
  const subjectInput = readSubjects(formData.get("subjects_json"));
  if (!categoryId || !examGroupId || !paperId) return { success: false, message: "Choose an Exam Category, Exam, and Paper." };
  if (subjectInput.error || !subjectInput.subjects) return { success: false, message: subjectInput.error ?? "Add Subjects." };

  const [{ data: paper }, { data: exam }] = await Promise.all([supabase.from("papers").select("id, exam_group_id").eq("id", paperId).maybeSingle(), supabase.from("exam_groups").select("id, exam_id").eq("id", examGroupId).maybeSingle()]);
  if (!paper || !exam || paper.exam_group_id !== examGroupId || exam.exam_id !== categoryId) return { success: false, message: "The selected Category, Exam, and Paper do not belong together." };

  const { data: existingSubjects, error: existingError } = await supabase.from("subjects").select("name, slug, display_order").eq("paper_id", paperId);
  if (existingError) return { success: false, message: existingError.message };
  const existingNames = new Set((existingSubjects ?? []).map((subject) => subject.name.trim().toLowerCase()));
  const duplicateName = subjectInput.subjects.find((subject) => existingNames.has(subject.name.toLowerCase()))?.name;
  if (duplicateName) return { success: false, message: `The Subject "${duplicateName}" already exists in this Paper. Subject names are not case-sensitive.` };
  const usedSlugs = new Set((existingSubjects ?? []).map((subject) => subject.slug));
  const nextOrder = Math.max(0, ...(existingSubjects ?? []).map((subject) => subject.display_order)) + 1;
  const { error } = await supabase.from("subjects").insert(subjectInput.subjects.map((subject, index) => ({ paper_id: paperId, name: subject.name, slug: subjectSlug(subject.name, index, usedSlugs), description: null, content_language_mode: subject.contentLanguageMode, display_order: nextOrder + index, is_active: true })));
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/subjects"); revalidatePath("/admin/exams"); revalidatePath("/admin/questions"); revalidatePath("/admin/mock-tests"); revalidatePath("/mock-tests"); revalidateTag(PUBLIC_CATALOG_TAG, "max");
  return { success: true, message: `${subjectInput.subjects.length} ${subjectInput.subjects.length === 1 ? "Subject" : "Subjects"} added successfully.` };
}
