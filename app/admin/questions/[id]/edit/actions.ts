"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CorrectAnswer, QuestionLifecycle } from "@/types/question";
import type { SubjectContentLanguageMode } from "@/types/subject";

export type UpdateQuestionState = { success: boolean; message: string };

const answers: CorrectAnswer[] = ["A", "B", "C", "D"];
const lifecycles: QuestionLifecycle[] = ["permanent", "review", "expires"];
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

function languageValues(formData: FormData, suffix: "" | "_te") {
  return {
    question: String(formData.get(`question_text${suffix}`) ?? "").trim(),
    options: ["a", "b", "c", "d"].map((letter) =>
      String(formData.get(`option_${letter}${suffix}`) ?? "").trim(),
    ),
    explanation:
      String(formData.get(`explanation${suffix}`) ?? "").trim() || null,
  };
}

function languageIsComplete(values: ReturnType<typeof languageValues>) {
  return Boolean(values.question) && values.options.every(Boolean);
}

export async function updateQuestion(
  questionId: string,
  _previous: UpdateQuestionState,
  formData: FormData,
): Promise<UpdateQuestionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { success: false, message: "You are not authorized to update Questions." };
  }

  const subjectId = String(formData.get("subject_id") ?? "").trim();
  const correctAnswer = String(formData.get("correct_answer") ?? "") as CorrectAnswer;
  const lifecycle = String(
    formData.get("content_lifecycle") ?? "permanent",
  ) as QuestionLifecycle;
  const reviewOn = String(formData.get("review_on") ?? "").trim();
  const expiresOn = String(formData.get("expires_on") ?? "").trim();

  if (!subjectId || !answers.includes(correctAnswer)) {
    return { success: false, message: "Complete the Subject and correct answer." };
  }
  if (
    !lifecycles.includes(lifecycle) ||
    (lifecycle === "review" && !validDate(reviewOn)) ||
    (lifecycle === "expires" && !validDate(expiresOn))
  ) {
    return { success: false, message: "Choose a valid question lifetime and date." };
  }

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, content_language_mode")
    .eq("id", subjectId)
    .maybeSingle();
  if (!subject) {
    return { success: false, message: "The selected Subject could not be found." };
  }

  const languageMode =
    subject.content_language_mode as SubjectContentLanguageMode;
  const english = languageValues(formData, "");
  const telugu = languageValues(formData, "_te");
  if (languageMode !== "telugu" && !languageIsComplete(english)) {
    return { success: false, message: "Complete the English question and all four options." };
  }
  if (languageMode !== "english" && !languageIsComplete(telugu)) {
    return { success: false, message: "Complete the Telugu question and all four options." };
  }

  const canonical = languageMode === "telugu" ? telugu : english;
  if (new Set(canonical.options.map((item) => item.toLocaleLowerCase())).size !== 4) {
    return { success: false, message: "All four answer options must be different." };
  }

  const { data: duplicate } = await supabase
    .from("questions")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("question_text", canonical.question)
    .neq("id", questionId)
    .maybeSingle();
  if (duplicate) {
    return { success: false, message: "This Question already exists under the selected Subject." };
  }

  const { error } = await supabase
    .from("questions")
    .update({
      subject_id: subjectId,
      question_text: canonical.question,
      option_a: canonical.options[0],
      option_b: canonical.options[1],
      option_c: canonical.options[2],
      option_d: canonical.options[3],
      question_text_te: languageMode === "english" ? null : telugu.question,
      option_a_te: languageMode === "english" ? null : telugu.options[0],
      option_b_te: languageMode === "english" ? null : telugu.options[1],
      option_c_te: languageMode === "english" ? null : telugu.options[2],
      option_d_te: languageMode === "english" ? null : telugu.options[3],
      correct_answer: correctAnswer,
      explanation: canonical.explanation,
      explanation_te: languageMode === "english" ? null : telugu.explanation,
      source_reference:
        String(formData.get("source_reference") ?? "").trim() || null,
      is_active: formData.get("is_active") === "on",
      content_lifecycle: lifecycle,
      review_on: lifecycle === "review" ? reviewOn : null,
      expires_on: lifecycle === "expires" ? expiresOn : null,
    })
    .eq("id", questionId);

  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${questionId}/edit`);
  revalidatePath("/admin/mock-tests");
  return { success: true, message: "Question updated in English and Telugu." };
}
