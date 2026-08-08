"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readPaperInputs, toPaperRows } from "../../paper-inputs";

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

  const newPaperInput = readPaperInputs(formData.get("new_papers_json"), 0);

  if (newPaperInput.error || !newPaperInput.papers) {
    return {
      success: false,
      message: newPaperInput.error ?? "Check the new Paper details.",
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

  const { error: updateError } = await supabase
    .from("exam_groups")
    .update({
      exam_id: examId,
      name,
      slug,
      description: description || null,
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

  if (newPaperInput.papers.length > 0) {
    const { data: existingPapers, error: existingPapersError } = await supabase
      .from("papers")
      .select("slug, display_order")
      .eq("exam_group_id", groupId);

    if (existingPapersError) {
      return { success: false, message: existingPapersError.message };
    }

    const nextDisplayOrder = Math.max(0, ...(existingPapers ?? []).map((paper) => paper.display_order)) + 1;
    const { error: papersError } = await supabase
      .from("papers")
      .insert(toPaperRows(groupId, newPaperInput.papers, (existingPapers ?? []).map((paper) => paper.slug), nextDisplayOrder));

    if (papersError) {
      return { success: false, message: `Exam details were saved, but the new Papers could not be added: ${papersError.message}` };
    }
  }

  revalidatePath("/admin/groups");
  revalidatePath("/admin/papers");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/mock-tests");
  revalidatePath("/admin/questions");
  revalidatePath("/mock-tests");
  revalidatePath(`/admin/groups/${groupId}/edit`);

  return {
    success: true,
    message: newPaperInput.papers.length > 0 ? `Exam updated and ${newPaperInput.papers.length} ${newPaperInput.papers.length === 1 ? "Paper" : "Papers"} added.` : "Exam updated successfully.",
  };
}
