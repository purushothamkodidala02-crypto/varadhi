"use server";

import { revalidatePath } from "next/cache";
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
      message: "You are not authorized to update exams.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();

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

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    return {
      success: false,
      message: "Display order must be zero or a positive number.",
    };
  }

  const { error: updateError } = await supabase
    .from("exams")
    .update({
      name,
      slug,
      description: description || null,
      is_active: isActive,
      display_order: displayOrder,
    })
    .eq("id", examId)
    .select("id")
    .single();

  if (updateError?.code === "23505") {
    return {
      success: false,
      message: `An exam with the slug "${slug}" already exists.`,
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

  return {
    success: true,
    message: "Exam updated successfully.",
  };
}