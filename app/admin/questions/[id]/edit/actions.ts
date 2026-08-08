"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CorrectAnswer, QuestionLifecycle } from "@/types/question";

export type UpdateQuestionState = {
  success: boolean;
  message: string;
};

const validAnswers: CorrectAnswer[] = ["A", "B", "C", "D"];
const validLifecycles: QuestionLifecycle[] = ["permanent", "review", "expires"];

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export async function updateQuestion(
  questionId: string,
  _previousState: UpdateQuestionState,
  formData: FormData
): Promise<UpdateQuestionState> {
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
      message: "You are not authorized to update Questions.",
    };
  }

  const subjectId = String(formData.get("subject_id") ?? "").trim();
  const questionText = String(formData.get("question_text") ?? "").trim();
  const optionA = String(formData.get("option_a") ?? "").trim();
  const optionB = String(formData.get("option_b") ?? "").trim();
  const optionC = String(formData.get("option_c") ?? "").trim();
  const optionD = String(formData.get("option_d") ?? "").trim();
  const correctAnswer = String(
    formData.get("correct_answer") ?? ""
  ) as CorrectAnswer;
  const explanation = String(formData.get("explanation") ?? "").trim();
  const sourceReference = String(
    formData.get("source_reference") ?? ""
  ).trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const isActive = formData.get("is_active") === "on";
  const lifecycle = String(formData.get("content_lifecycle") ?? "permanent") as QuestionLifecycle;
  const reviewOn = String(formData.get("review_on") ?? "").trim();
  const expiresOn = String(formData.get("expires_on") ?? "").trim();
  const selectedGroupIds = Array.from(new Set(formData.getAll("exam_group_ids").map((value) => String(value).trim()).filter(Boolean)));

  if (!subjectId || !questionText) {
    return {
      success: false,
      message: "Subject and Question text are required.",
    };
  }

  if (!optionA || !optionB || !optionC || !optionD) {
    return {
      success: false,
      message: "All four answer options are required.",
    };
  }

  const normalizedOptions = [optionA, optionB, optionC, optionD].map(
    (option) => option.toLowerCase()
  );

  if (new Set(normalizedOptions).size !== 4) {
    return {
      success: false,
      message: "All four answer options must be different.",
    };
  }

  if (!validAnswers.includes(correctAnswer)) {
    return {
      success: false,
      message: "Please select the correct answer.",
    };
  }

  if (!validLifecycles.includes(lifecycle)) {
    return { success: false, message: "Choose a valid Question lifetime." };
  }

  if (lifecycle === "review" && !validDate(reviewOn)) {
    return { success: false, message: "Choose a valid review date." };
  }

  if (lifecycle === "expires" && !validDate(expiresOn)) {
    return { success: false, message: "Choose a valid expiry date." };
  }

  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id, exam_group_id")
    .eq("id", subjectId)
    .single();

  if (subjectError || !subject) {
    return {
      success: false,
      message: "The selected Subject could not be found.",
    };
  }

  const suitableGroupIds = Array.from(new Set([subject.exam_group_id, ...selectedGroupIds]));
  const { data: validGroups, error: groupError } = await supabase
    .from("exam_groups")
    .select("id")
    .in("id", suitableGroupIds);

  if (groupError || (validGroups?.length ?? 0) !== suitableGroupIds.length) {
    return { success: false, message: "One or more selected Exams could not be found." };
  }

  const { data: duplicate } = await supabase
    .from("questions")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("question_text", questionText)
    .neq("id", questionId)
    .maybeSingle();

  if (duplicate) {
    return {
      success: false,
      message: "This Question already exists under the selected Subject.",
    };
  }

  const { error: updateError } = await supabase
    .from("questions")
    .update({
      subject_id: subjectId,
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_answer: correctAnswer,
      explanation: explanation || null,
      image_url: imageUrl || null,
      source_reference: sourceReference || null,
      is_active: isActive,
      content_lifecycle: lifecycle,
      review_on: lifecycle === "review" ? reviewOn : null,
      expires_on: lifecycle === "expires" ? expiresOn : null,
    })
    .eq("id", questionId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  const { error: clearSuitabilityError } = await supabase
    .from("question_exam_groups")
    .delete()
    .eq("question_id", questionId);

  if (clearSuitabilityError) {
    return { success: false, message: clearSuitabilityError.message };
  }

  const { error: suitabilityError } = await supabase
    .from("question_exam_groups")
    .insert(suitableGroupIds.map((examGroupId) => ({ question_id: questionId, exam_group_id: examGroupId })));

  if (suitabilityError) {
    return { success: false, message: suitabilityError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${questionId}/edit`);

  return { success: true, message: "Question updated successfully." };
}
