"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MockTestAccessType, MockTestStatus } from "@/types/mock-test";

export type CreateMockTestState = {
  success: boolean;
  message: string;
};

const validStatuses: MockTestStatus[] = [
  "draft",
];

export async function createMockTest(
  _previousState: CreateMockTestState,
  formData: FormData
): Promise<CreateMockTestState> {
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
      message: "You are not authorized to create Mock Tests.",
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
  const accessType = String(formData.get("access_type") ?? "free") as MockTestAccessType;
  const priceValue = String(formData.get("price_inr") ?? "").trim();
  const priceInr = priceValue ? Number(priceValue) : null;

  if (!examGroupId) {
    return {
      success: false,
      message: "Please select an Exam.",
    };
  }

  if (!title) {
    return {
      success: false,
      message: "Mock Test title is required.",
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
      message: "Display order must be zero or a positive number.",
    };
  }

  if (accessType !== "free" && accessType !== "paid") {
    return { success: false, message: "Please choose Free or Paid access." };
  }

  if (accessType === "paid" && (!priceInr || !Number.isFinite(priceInr) || priceInr <= 0)) {
    return { success: false, message: "Enter a valid price in INR for a paid Mock Test." };
  }

  const { data: group, error: groupError } = await supabase
    .from("exam_groups")
    .select("id")
    .eq("id", examGroupId)
    .single();

  if (groupError || !group) {
    return {
      success: false,
      message: "The selected Exam could not be found.",
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
          "The selected Subject does not belong to this Exam.",
      };
    }
  }

  const { error: insertError } = await supabase
    .from("mock_tests")
    .insert({
      exam_group_id: examGroupId,
      subject_id: subjectId,
      title,
      slug,
      description: description || null,
      instructions: instructions || null,
      duration_minutes: durationMinutes,
      difficulty: "mixed",
      status,
      version: 1,
      display_order: displayOrder,
      published_at:
        status === "published"
          ? new Date().toISOString()
          : null,
      access_type: accessType,
      price_inr: accessType === "paid" ? priceInr : null,
    });

  if (insertError?.code === "23505") {
    return {
      success: false,
      message: `A Mock Test with the slug "${slug}" already exists under this Exam.`,
    };
  }

  if (insertError) {
    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/mock-tests");
  revalidatePath("/mock-tests");

  return {
    success: true,
    message: "Mock Test created successfully.",
  };
}
