"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CorrectAnswer, QuestionLifecycle } from "@/types/question";

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
const validLifecycles: QuestionLifecycle[] = ["permanent", "review", "expires"];

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

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
  const lifecycle = String(formData.get("content_lifecycle") ?? "permanent") as QuestionLifecycle;
  const reviewOn = String(formData.get("review_on") ?? "").trim();
  const expiresOn = String(formData.get("expires_on") ?? "").trim();
  const selectedExamIds = Array.from(new Set(formData.getAll("exam_ids").map((value) => String(value).trim()).filter(Boolean)));

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

  if (selectedExamIds.length === 0) {
    return { success: false, message: "Tick at least one Exam before choosing an exam entry." };
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

  const { data: subject, error: subjectError } =
    await supabase
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

  const { data: validGroups, error: groupError } = await supabase
    .from("exam_groups")
    .select("id, exam_id")
    .in("exam_id", selectedExamIds);

  if (groupError || !validGroups?.length) {
    return { success: false, message: "The selected Exam does not have any exam entries yet." };
  }

  const suitableGroupIds = validGroups.map((group) => group.id);
  if (!suitableGroupIds.includes(subject.exam_group_id)) {
    return { success: false, message: "Choose a Subject that belongs to one of the checked Exams." };
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

  const { data: createdQuestion, error: insertError } = await supabase
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
      content_lifecycle: lifecycle,
      review_on: lifecycle === "review" ? reviewOn : null,
      expires_on: lifecycle === "expires" ? expiresOn : null,
    })
    .select("id")
    .single();

  if (insertError || !createdQuestion) {
    return {
      success: false,
      message: insertError?.message ?? "Unable to create the Question.",
    };
  }

  const { error: suitabilityError } = await supabase
    .from("question_exam_groups")
    .insert(suitableGroupIds.map((examGroupId) => ({ question_id: createdQuestion.id, exam_group_id: examGroupId })));

  if (suitabilityError) {
    await supabase.from("questions").delete().eq("id", createdQuestion.id);
    return { success: false, message: suitabilityError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/questions");

  return {
    success: true,
    message: "Question created successfully.",
  };
}
