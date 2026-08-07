"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MockTestStatus } from "@/types/mock-test";

export type UpdateMockTestState = {
  success: boolean;
  message: string;
};

const validStatuses: MockTestStatus[] = [
  "draft",
  "published",
];

export async function updateMockTest(
  mockTestId: string,
  _previousState: UpdateMockTestState,
  formData: FormData
): Promise<UpdateMockTestState> {
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
      message: "You are not authorized to update Mock Tests.",
    };
  }

  const { data: currentTest, error: currentTestError } =
    await supabase
      .from("mock_tests")
      .select("id, status")
      .eq("id", mockTestId)
      .single();

  if (currentTestError || !currentTest) {
    return {
      success: false,
      message: "Mock Test not found.",
    };
  }

  if (currentTest.status !== "draft") {
    return {
      success: false,
      message:
        "Published or archived Mock Tests are locked. Create a new version instead.",
    };
  }

  const examGroupId = String(
    formData.get("exam_group_id") ?? ""
  ).trim();

  const subjectValue = String(
    formData.get("subject_id") ?? ""
  ).trim();

  const subjectId = subjectValue || null;
  const title = String(formData.get("title") ?? "").trim();

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const instructions = String(
    formData.get("instructions") ?? ""
  ).trim();

  const durationMinutes = Number(
    formData.get("duration_minutes") ?? 0
  );

  const status = String(
    formData.get("status") ?? "draft"
  ) as MockTestStatus;

  const displayOrder = Number(
    formData.get("display_order") ?? 0
  );

  if (!examGroupId || !title) {
    return {
      success: false,
      message: "Exam Entry and title are required.",
    };
  }

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return {
      success: false,
      message:
        "Slug can contain only lowercase letters, numbers and hyphens.",
    };
  }

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return {
      success: false,
      message: "Duration must be a positive whole number.",
    };
  }

  if (!validStatuses.includes(status)) {
    return {
      success: false,
      message: "Please select a valid status.",
    };
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    return {
      success: false,
      message: "Display order must be zero or positive.",
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
      message: "The selected Exam Entry could not be found.",
    };
  }

  if (subjectId) {
    const { data: subject, error: subjectError } =
      await supabase
        .from("subjects")
        .select("id, exam_group_id")
        .eq("id", subjectId)
        .single();

    if (
      subjectError ||
      !subject ||
      subject.exam_group_id !== examGroupId
    ) {
      return {
        success: false,
        message:
          "The selected Subject does not belong to this Exam Entry.",
      };
    }
  }

  const { error: updateError } = await supabase
    .from("mock_tests")
    .update({
      exam_group_id: examGroupId,
      subject_id: subjectId,
      title,
      slug,
      description: description || null,
      instructions: instructions || null,
      duration_minutes: durationMinutes,
      difficulty: "mixed",
      status,
      display_order: displayOrder,
      published_at:
        status === "published"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", mockTestId)
    .select("id")
    .single();

  if (updateError?.code === "23505") {
    return {
      success: false,
      message: `A Mock Test with the slug "${slug}" already exists under this Exam Entry.`,
    };
  }

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/mock-tests");
  revalidatePath(`/admin/mock-tests/${mockTestId}/edit`);
  revalidatePath("/mock-tests");

  return {
    success: true,
    message:
      status === "published"
        ? "Mock Test published successfully."
        : "Mock Test updated successfully.",
  };
}