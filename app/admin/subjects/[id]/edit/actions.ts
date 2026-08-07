"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateSubjectState = {
  success: boolean;
  message: string;
};

export async function updateSubject(
  subjectId: string,
  _previousState: UpdateSubjectState,
  formData: FormData
): Promise<UpdateSubjectState> {
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
      message: "You are not authorized to update Subjects.",
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

  const { error: updateError } = await supabase
    .from("subjects")
    .update({
      exam_group_id: examGroupId,
      name,
      slug,
      description: description || null,
      is_active: isActive,
      display_order: displayOrder,
    })
    .eq("id", subjectId)
    .select("id")
    .single();

  if (updateError?.code === "23505") {
    return {
      success: false,
      message: `A Subject with the slug "${slug}" already exists under this Group.`,
    };
  }

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  revalidatePath("/admin/subjects");
  revalidatePath(`/admin/subjects/${subjectId}/edit`);

  return {
    success: true,
    message: "Subject updated successfully.",
  };
}