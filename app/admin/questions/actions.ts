"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CorrectAnswer } from "@/types/question";

export type CreateQuestionState = {
  success: boolean;
  message: string;
};

const validAnswers: CorrectAnswer[] = [
  "A",
  "B",
  "C",
  "D",
];

export async function createQuestion(
  _previousState: CreateQuestionState,
  formData: FormData
): Promise<CreateQuestionState> {
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
      message: "You are not authorized to create Questions.",
    };
  }

  const subjectId = String(
    formData.get("subject_id") ?? ""
  ).trim();

  const questionText = String(
    formData.get("question_text") ?? ""
  ).trim();

  const optionA = String(
    formData.get("option_a") ?? ""
  ).trim();

  const optionB = String(
    formData.get("option_b") ?? ""
  ).trim();

  const optionC = String(
    formData.get("option_c") ?? ""
  ).trim();

  const optionD = String(
    formData.get("option_d") ?? ""
  ).trim();

  const correctAnswer = String(
    formData.get("correct_answer") ?? ""
  ) as CorrectAnswer;

  const explanation = String(
    formData.get("explanation") ?? ""
  ).trim();

  const sourceReference = String(
    formData.get("source_reference") ?? ""
  ).trim();

  const imageUrl = String(
    formData.get("image_url") ?? ""
  ).trim();

  const isActive = formData.get("is_active") === "on";

  if (!subjectId) {
    return {
      success: false,
      message: "Please select a Subject.",
    };
  }

  if (!questionText) {
    return {
      success: false,
      message: "Question text is required.",
    };
  }

  if (!optionA || !optionB || !optionC || !optionD) {
    return {
      success: false,
      message: "All four answer options are required.",
    };
  }

  const normalizedOptions = [
    optionA,
    optionB,
    optionC,
    optionD,
  ].map((option) => option.toLowerCase());

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

  const { data: subject, error: subjectError } =
    await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .single();

  if (subjectError || !subject) {
    return {
      success: false,
      message: "The selected Subject could not be found.",
    };
  }

  const { data: existingQuestion } = await supabase
    .from("questions")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("question_text", questionText)
    .limit(1)
    .maybeSingle();

  if (existingQuestion) {
    return {
      success: false,
      message:
        "This Question already exists under the selected Subject.",
    };
  }

  const { error: insertError } = await supabase
    .from("questions")
    .insert({
      subject_id: subjectId,
      question_text: questionText,
      question_type: "mcq",
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_answer: correctAnswer,
      explanation: explanation || null,
      difficulty: "medium",
      image_url: imageUrl || null,
      source_reference: sourceReference || null,
      is_active: isActive,
    });

  if (insertError) {
    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/questions");

  return {
    success: true,
    message: "Question created successfully.",
  };
}