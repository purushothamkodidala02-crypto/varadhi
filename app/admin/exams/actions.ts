"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";
import { readSeoFields } from "@/lib/seo-fields";
import { createClient } from "@/lib/supabase/server";

export type CreateExamState = {
  success: boolean;
  message: string;
};

export async function createExam(
  _previousState: CreateExamState,
  formData: FormData
): Promise<CreateExamState> {
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
      message: "You are not authorized to create exam categories.",
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

  const displayOrderValue = Number(
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
    .eq("state_id", stateId);

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

  const displayOrder = Number.isFinite(displayOrderValue)
    ? displayOrderValue
    : 0;

  const { error: insertError } = await supabase
    .from("exams")
    .insert({
      state_id: stateId,
      name,
      slug,
      description: description || null,
      ...seo.value,
      is_active: isActive,
      display_order: displayOrder,
    });

  if (insertError?.code === "23505") {
    return {
      success: false,
      message: `An exam category with the slug "${slug}" already exists.`,
    };
  }

  if (insertError) {
    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/exams");
  revalidateTag(PUBLIC_CATALOG_TAG, "max");

  return {
    success: true,
    message: "Exam category created successfully.",
  };
}
