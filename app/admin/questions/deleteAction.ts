"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DeleteQuestionResult = {
  success: boolean;
  message: string;
};

export async function deleteQuestion(
  questionId: string
): Promise<DeleteQuestionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "You must be logged in." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return {
      success: false,
      message: "You are not authorized to delete Questions.",
    };
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, question_text")
    .eq("id", questionId)
    .single();

  if (questionError || !question) {
    return { success: false, message: "Question not found." };
  }

  const { count, error: assignmentError } = await supabase
    .from("mock_test_questions")
    .select("id", { count: "exact", head: true })
    .eq("question_id", questionId);

  if (assignmentError) {
    return {
      success: false,
      message: "Unable to check this Question's Mock Test assignments.",
    };
  }

  if ((count ?? 0) > 0) {
    return {
      success: false,
      message: `Cannot delete this Question because it is assigned to ${count} Mock Test(s). Deactivate it instead.`,
    };
  }

  const { error: deleteError } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (deleteError) {
    return { success: false, message: deleteError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/questions");

  return {
    success: true,
    message: `"${question.question_text}" was deleted successfully.`,
  };
}
