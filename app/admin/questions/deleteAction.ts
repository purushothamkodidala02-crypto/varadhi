"use server";

import { revalidatePath } from "next/cache";
import { questionMediaPath, removeQuestionImage } from "@/lib/questions/media";
import { createClient } from "@/lib/supabase/server";

export type DeleteQuestionResult = { success: boolean; message: string };

async function authorizedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase, error: "You are not authorized to manage Questions." };
  return { supabase };
}

export async function deleteQuestion(questionId: string): Promise<DeleteQuestionResult> {
  const result = await authorizedClient();
  if ("error" in result) return { success: false, message: result.error ?? "Unable to delete this Question." };
  const { data: question } = await result.supabase.from("questions").select("id, question_text").eq("id", questionId).maybeSingle();
  if (!question) return { success: false, message: "Question not found." };
  const { data, error } = await result.supabase.rpc("delete_question_safely", { requested_question_id: questionId });
  if (error) {
    const message = error.message.includes("assigned to a Mock Test")
      ? "This Question is assigned to a Mock Test. Remove its assignments first, or make it unavailable instead."
      : error.message.includes("retained student attempt")
        ? "This Question is required for a student's retained result or answer review, so permanent deletion is blocked. Make it unavailable instead."
        : error.message;
    return { success: false, message };
  }
  const imageUrl = data?.[0]?.deleted_image_url;
  if (imageUrl) await removeQuestionImage(result.supabase, questionMediaPath(imageUrl));
  revalidatePath("/admin");
  revalidatePath("/admin/questions");
  return { success: true, message: `"${question.question_text}" was permanently deleted.` };
}

export async function makeQuestionUnavailable(questionId: string): Promise<DeleteQuestionResult> {
  const result = await authorizedClient();
  if ("error" in result) return { success: false, message: result.error ?? "Unable to update this Question." };
  const { error } = await result.supabase.rpc("make_question_unavailable_safely", { requested_question_id: questionId });
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/questions");
  revalidatePath("/admin/mock-tests");
  return { success: true, message: "Question is unavailable for future use. Existing attempts and reviews remain safe." };
}
