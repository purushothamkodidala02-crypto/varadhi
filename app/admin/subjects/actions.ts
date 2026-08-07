"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateSubjectState = {
  success: boolean;
  message: string;
};

export async function createSubject(
  _previousState: CreateSubjectState,
  formData: FormData
): Promise<CreateSubjectState> {
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
      message: "You are not authorized to create Subjects.",
    };
  }

  const examGroupId = String(
    formData.get("exam_group_id") ?? ""
  ).trim();

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

  if (!examGroupId) {
    return {
      success: false,
      message: "Please select a Group.",
    };
  }

  if (!name) {
    return {
      success: false,
      message: "Subject name is required.",
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

  const { data: group, error: groupError } = await supabase
    .from("exam_groups")
    .select("id")
    .eq("id", examGroupId)
    .single();

  if (groupError || !group) {
    return {
      success: false,
      message: "The selected Group could not be found.",
    };
  }

  const { error: insertError } = await supabase
    .from("subjects")
    .insert({
      exam_group_id: examGroupId,
      name,
      slug,
      description: description || null,
      is_active: isActive,
      display_order: displayOrder,
    });

  if (insertError?.code === "23505") {
    return {
      success: false,
      message: `A Subject with the slug "${slug}" already exists under this Group.`,
    };
  }

  if (insertError) {
    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidatePath("/admin/subjects");

  return {
    success: true,
    message: "Subject created successfully.",
  };
}