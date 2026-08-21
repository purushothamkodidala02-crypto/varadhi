"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";
import { createClient } from "@/lib/supabase/server";
import { readPaperInputs, toPaperRows } from "./paper-inputs";
import { readSpecializationInputs } from "./specialization-inputs";

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

  const specializationInput = readSpecializationInputs(formData.get("specializations_json"));
  if (specializationInput.error || !specializationInput.specializations) {
    return { success: false, message: specializationInput.error ?? "Check the Specialisations." };
  }

  const paperInput = readPaperInputs(formData.get("papers_json"), 0);

  if (paperInput.error || !paperInput.papers) {
    return {
      success: false,
      message: paperInput.error ?? "Check the Papers for this Exam.",
    };
  }

  if (paperInput.papers.length === 0 && specializationInput.specializations.length === 0) {
    return {
      success: false,
      message: "Add at least one direct Paper or one Specialisation for this Exam.",
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

  const placeholderGroupId = "00000000-0000-0000-0000-000000000000";
  const directPapers = toPaperRows(placeholderGroupId, paperInput.papers);
  const usedSlugs = directPapers.map((paper) => paper.slug);
  let nextDisplayOrder = directPapers.length + 1;
  const specializations = specializationInput.specializations.map((specialization) => {
    const specializationPapers = toPaperRows(
      placeholderGroupId,
      specialization.papers,
      usedSlugs,
      nextDisplayOrder,
    );
    usedSlugs.push(...specializationPapers.map((paper) => paper.slug));
    nextDisplayOrder += specializationPapers.length;
    return { ...specialization, papers: specializationPapers };
  });
  const allPaperCount = directPapers.length + specializations.reduce(
    (total, specialization) => total + specialization.papers.length,
    0,
  );

  const { data: groupId, error: insertError } = await supabase.rpc(
    "create_exam_structure_atomic",
    {
      requested_exam_id: examId,
      requested_name: name,
      requested_slug: slug,
      requested_description: description,
      requested_is_active: isActive,
      requested_display_order: displayOrder,
      requested_direct_papers: directPapers,
      requested_specializations: specializations,
    },
  );

  if (insertError?.code === "23505") {
    return {
      success: false,
      message: `An Exam with the slug "${slug}" already exists under this exam category.`,
    };
  }

  if (insertError || !groupId) {
    return {
      success: false,
      message: insertError?.message ?? "The Exam could not be created.",
    };
  }

  revalidatePath("/admin/groups");
  revalidatePath("/admin/exams");
  revalidatePath(`/admin/groups/${groupId}/edit`);
  revalidatePath("/admin/papers");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/mock-tests");
  revalidatePath("/admin/questions");
  revalidatePath("/mock-tests");
  revalidateTag(PUBLIC_CATALOG_TAG, "max");

  return {
    success: true,
    message: `Exam created with ${specializationInput.specializations.length ? `${specializationInput.specializations.length} ${specializationInput.specializations.length === 1 ? "Specialisation" : "Specialisations"}` : "no Specialisations"} and ${allPaperCount} ${allPaperCount === 1 ? "Paper" : "Papers"}.`,
  };
}
