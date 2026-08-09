"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readPaperInputs, toPaperRows } from "./paper-inputs";

export type CreateGroupState = {
  success: boolean;
  message: string;
};

export async function createGroup(
  _previousState: CreateGroupState,
  formData: FormData
): Promise<CreateGroupState> {
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
      message: "You are not authorized to create Exams.",
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

  const paperInput = readPaperInputs(formData.get("papers_json"), 1);

  if (paperInput.error || !paperInput.papers) {
    return {
      success: false,
      message: paperInput.error ?? "Add the Papers for this Exam.",
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
    .eq("exam_id", examId);

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

  const { data: group, error: insertError } = await supabase
    .from("exam_groups")
    .insert({
      exam_id: examId,
      name,
      slug,
      description: description || null,
      is_active: isActive,
      display_order: displayOrder,
    })
    .select("id")
    .single();

  if (insertError?.code === "23505") {
    return {
      success: false,
      message: `An Exam with the slug "${slug}" already exists under this exam category.`,
    };
  }

  if (insertError || !group) {
    return {
      success: false,
      message: insertError?.message ?? "The Exam could not be created.",
    };
  }

  const { error: papersError } = await supabase
    .from("papers")
    .insert(toPaperRows(group.id, paperInput.papers));

  if (papersError) {
    await supabase.from("exam_groups").delete().eq("id", group.id);
    return {
      success: false,
      message: `The Exam could not be created because its Papers could not be saved: ${papersError.message}`,
    };
  }

  revalidatePath("/admin/groups");
  revalidatePath("/admin/papers");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/mock-tests");
  revalidatePath("/admin/questions");
  revalidatePath("/mock-tests");

  return {
    success: true,
    message: `Exam created with ${paperInput.papers.length} ${paperInput.papers.length === 1 ? "Paper" : "Papers"}.`,
  };
}
