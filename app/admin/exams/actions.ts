"use server";

import { revalidatePath } from "next/cache";
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
      message: "You are not authorized to create exams.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();

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

  if (!name) {
    return {
      success: false,
      message: "Exam name is required.",
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
      name,
      slug,
      description: description || null,
      is_active: isActive,
      display_order: displayOrder,
    });

  if (insertError?.code === "23505") {
    return {
      success: false,
      message: `An exam with the slug "${slug}" already exists.`,
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

  return {
    success: true,
    message: "Exam created successfully.",
  };
}