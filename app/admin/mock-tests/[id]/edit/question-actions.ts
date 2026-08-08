"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AssignmentState = { success: boolean; message: string };

async function getDraftMockTest(mockTestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, error: "You must be logged in." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { supabase, error: "You are not authorized to manage Questions." };
  }

  const { data: mockTest, error: mockTestError } = await supabase
    .from("mock_tests")
    .select("id, subject_id, status")
    .eq("id", mockTestId)
    .single();

  if (mockTestError || !mockTest) {
    return { supabase, error: "Mock Test not found." };
  }

  if (mockTest.status !== "draft") {
    return { supabase, error: "Only draft Mock Tests can be changed." };
  }

  return { supabase, mockTest };
}

export async function assignQuestion(
  mockTestId: string,
  _previousState: AssignmentState,
  formData: FormData
): Promise<AssignmentState> {
  const result = await getDraftMockTest(mockTestId);
  if ("error" in result) {
    return { success: false, message: result.error ?? "Unable to assign the Question." };
  }

  const questionId = String(formData.get("question_id") ?? "").trim();
  const questionOrder = Number(formData.get("question_order") ?? 0);
  const marks = Number(formData.get("marks") ?? 0);
  const negativeMarks = Number(formData.get("negative_marks") ?? 0);

  if (!questionId || !Number.isInteger(questionOrder) || questionOrder < 1) {
    return { success: false, message: "Choose a Question and a positive whole-number order." };
  }

  if (!Number.isFinite(marks) || marks <= 0 || !Number.isFinite(negativeMarks) || negativeMarks < 0) {
    return { success: false, message: "Marks must be positive and negative marks cannot be below zero." };
  }

  const { data: question, error: questionError } = await result.supabase
    .from("questions")
    .select("id, subject_id, is_active")
    .eq("id", questionId)
    .single();

  if (questionError || !question || !question.is_active) {
    return { success: false, message: "The selected active Question could not be found." };
  }

  if (result.mockTest.subject_id && question.subject_id !== result.mockTest.subject_id) {
    return { success: false, message: "Choose a Question from this Mock Test's Subject." };
  }

  const { error: insertError } = await result.supabase
    .from("mock_test_questions")
    .insert({
      mock_test_id: mockTestId,
      question_id: questionId,
      question_order: questionOrder,
      marks,
      negative_marks: negativeMarks,
    });

  if (insertError?.code === "23505") {
    return { success: false, message: "That Question or order number is already assigned to this Mock Test." };
  }

  if (insertError) return { success: false, message: insertError.message };

  revalidatePath(`/admin/mock-tests/${mockTestId}/edit`);
  return { success: true, message: "Question added to this Mock Test." };
}

export async function removeAssignedQuestion(
  mockTestId: string,
  assignmentId: string
): Promise<AssignmentState> {
  const result = await getDraftMockTest(mockTestId);
  if ("error" in result) {
    return { success: false, message: result.error ?? "Unable to remove the Question." };
  }

  const { error } = await result.supabase
    .from("mock_test_questions")
    .delete()
    .eq("id", assignmentId)
    .eq("mock_test_id", mockTestId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/admin/mock-tests/${mockTestId}/edit`);
  return { success: true, message: "Question removed from this Mock Test." };
}
