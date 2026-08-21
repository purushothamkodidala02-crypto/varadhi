"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";
import { readSeoFields } from "@/lib/seo-fields";
import { createClient } from "@/lib/supabase/server";

export type UpdateExamState = {
  success: boolean;
  message: string;
};

export async function updateExam(
  examId: string,
  _previousState: UpdateExamState,
  formData: FormData
): Promise<UpdateExamState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be logged in.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return {
      success: false,
      message: "You are not authorized to update exam categories.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const stateId = String(formData.get("state_id") ?? "").trim();

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const displayOrder = Number(
    formData.get("display_order") ?? 0
  );

  const isActive = formData.get("is_active") === "on";
  const seo = readSeoFields(formData);

  if (seo.error) return { success: false, message: seo.error };

  if (!name || !stateId) {
    return {
      success: false,
      message: "State and exam board name are required.",
    };
  }

  const { data: existingCategories, error: existingCategoriesError } = await supabase
    .from("exams")
    .select("id, name")
    .eq("state_id", stateId)
    .neq("id", examId);

  if (existingCategoriesError) {
    return {
      success: false,
      message: existingCategoriesError.message,
    };
  }

  if (
    (existingCategories ?? []).some(
      (category) => category.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
    )
  ) {
    return {
      success: false,
      message: `An exam category named "${name}" already exists. Names are not case-sensitive.`,
    };
  }

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return {
      success: false,
      message:
        "Slug can contain only lowercase letters, numbers and hyphens.",
    };
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    return {
      success: false,
      message: "Display order must be zero or a positive number.",
    };
  }

  const { error: updateError } = await supabase
    .from("exams")
    .update({
      state_id: stateId,
      name,
      slug,
      description: description || null,
      ...seo.value,
      is_active: isActive,
      display_order: displayOrder,
    })
    .eq("id", examId)
    .select("id")
    .single();

  if (updateError?.code === "23505") {
    return {
      success: false,
      message: `An exam category with the slug "${slug}" already exists.`,
    };
  }

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${examId}/edit`);
  revalidateTag(PUBLIC_CATALOG_TAG, "max");

  return {
    success: true,
    message: "Exam category updated successfully.",
  };
}
