"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";
import { toCatalogSlug } from "@/lib/exam-catalog";
import { readSeoFields } from "@/lib/seo-fields";
import { createClient } from "@/lib/supabase/server";

export type StateActionResult = { success: boolean; message: string };

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, authorized: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, authorized: profile?.role === "admin" };
}

export async function createExamState(_previous: StateActionResult, formData: FormData): Promise<StateActionResult> {
  const { supabase, authorized } = await getAdminClient();
  if (!authorized) return { success: false, message: "Admin access is required." };
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const slug = toCatalogSlug(requestedSlug || name);
  const description = String(formData.get("description") ?? "").trim() || null;
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const seo = readSeoFields(formData);
  if (seo.error) return { success: false, message: seo.error };
  if (!name || !/^[A-Z0-9]{2,8}$/.test(code) || !slug) return { success: false, message: "Enter a state name, a 2–8 character code, and a valid slug." };
  if (!Number.isInteger(displayOrder) || displayOrder < 0) return { success: false, message: "Display order must be zero or higher." };
  const { error } = await supabase.from("exam_states").insert({ name, code, slug, description, ...seo.value, display_order: displayOrder, is_active: true });
  if (error?.code === "23505") return { success: false, message: "That state name, code, or slug is already in use." };
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/exams");
  revalidatePath("/");
  revalidatePath("/mock-tests");
  revalidateTag(PUBLIC_CATALOG_TAG, "max");
  return { success: true, message: `${name} was added to the catalogue.` };
}

export async function updateExamStateSlug(formData: FormData) {
  const { supabase, authorized } = await getAdminClient();
  if (!authorized) return;
  const id = String(formData.get("id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return;
  const { error } = await supabase.from("exam_states").update({ slug }).eq("id", id);
  if (error) return;
  revalidatePath("/admin/exams");
  revalidatePath("/");
  revalidatePath("/mock-tests");
  revalidateTag(PUBLIC_CATALOG_TAG, "max");
}

export async function updateExamStateSeo(_previous: StateActionResult, formData: FormData): Promise<StateActionResult> {
  const { supabase, authorized } = await getAdminClient();
  if (!authorized) return { success: false, message: "Admin access is required." };
  const id = String(formData.get("id") ?? "").trim();
  const seo = readSeoFields(formData);
  if (!id) return { success: false, message: "State not found." };
  if (seo.error) return { success: false, message: seo.error };
  const { error } = await supabase.from("exam_states").update(seo.value).eq("id", id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/exams");
  revalidatePath("/mock-tests");
  revalidateTag(PUBLIC_CATALOG_TAG, "max");
  return { success: true, message: "State search appearance saved." };
}

export async function toggleExamState(formData: FormData) {
  const { supabase, authorized } = await getAdminClient();
  if (!authorized) return;
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";
  if (!id) return;
  await supabase.from("exam_states").update({ is_active: !isActive }).eq("id", id);
  revalidatePath("/admin/exams");
  revalidatePath("/");
  revalidatePath("/mock-tests");
  revalidateTag(PUBLIC_CATALOG_TAG, "max");
}

export async function deleteExamState(formData: FormData) {
  const { supabase, authorized } = await getAdminClient();
  if (!authorized) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { count } = await supabase.from("exams").select("id", { count: "exact", head: true }).eq("state_id", id);
  if ((count ?? 0) > 0) return;
  await supabase.from("exam_states").delete().eq("id", id);
  revalidatePath("/admin/exams");
}
