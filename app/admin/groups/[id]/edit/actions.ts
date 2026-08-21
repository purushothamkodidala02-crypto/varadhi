"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";
import { readSeoFields } from "@/lib/seo-fields";
import { createClient } from "@/lib/supabase/server";

export type UpdateGroupState = {
  success: boolean;
  message: string;
};

export async function updateGroup(
  groupId: string,
  _previousState: UpdateGroupState,
  formData: FormData
): Promise<UpdateGroupState> {
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
      message: "You are not authorized to update Exams.",
    };
  }

  const examId = String(formData.get("exam_id") ?? "").trim();

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
  const seo = readSeoFields(formData);

  if (seo.error) return { success: false, message: seo.error };

  if (!examId) {
    return {
      success: false,
      message: "Please select an exam category.",
    };
  }

  if (!name) {
    return {
      success: false,
      message: "Name is required.",
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

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return {
      success: false,
      message: "The selected exam category could not be found.",
    };
  }

  const { data: existingExams, error: existingExamsError } = await supabase
    .from("exam_groups")
    .select("id, name")
    .eq("exam_id", examId)
    .neq("id", groupId);

  if (existingExamsError) {
    return {
      success: false,
      message: existingExamsError.message,
    };
  }

  if (
    (existingExams ?? []).some(
      (existingExam) =>
        existingExam.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    return {
      success: false,
      message: `An Exam named "${name}" already exists in this Exam Category. Names are not case-sensitive.`,
    };
  }

  const { error: updateError } = await supabase
    .from("exam_groups")
    .update({
      exam_id: examId,
      name,
      slug,
      description: description || null,
      ...seo.value,
      is_active: isActive,
      display_order: displayOrder,
    })
    .eq("id", groupId)
    .select("id")
    .single();

  if (updateError?.code === "23505") {
    return {
      success: false,
      message: `An Exam with the slug "${slug}" already exists under this exam category.`,
    };
  }

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  revalidatePath("/admin/groups");
  revalidatePath("/admin/exams");
  revalidatePath("/admin/papers");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/mock-tests");
  revalidatePath("/admin/questions");
  revalidatePath("/mock-tests");
  revalidateTag(PUBLIC_CATALOG_TAG, "max");
  revalidatePath(`/admin/groups/${groupId}/edit`);

  return {
    success: true,
    message: "Exam details updated successfully.",
  };
}
