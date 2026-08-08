"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Answer = "A" | "B" | "C" | "D";

export type SubmitAttemptResult = {
  success: boolean;
  message: string;
  score?: number;
  totalMarks?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  unansweredQuestions?: number;
};

export async function submitAttempt(
  mockTestId: string,
  answers: Record<string, Answer>
): Promise<SubmitAttemptResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "You must be logged in." };
  }

  const validAnswers = new Set<Answer>(["A", "B", "C", "D"]);
  const cleanedAnswers: Record<string, Answer> = {};

  for (const [questionId, answer] of Object.entries(answers)) {
    if (!questionId || !validAnswers.has(answer)) {
      return { success: false, message: "One or more submitted answers are invalid." };
    }
    cleanedAnswers[questionId] = answer;
  }

  const { data, error } = await supabase.rpc("submit_mock_test_attempt", {
    requested_mock_test_id: mockTestId,
    submitted_answers: cleanedAnswers,
  });

  const result = data?.[0];
  if (error || !result) {
    return { success: false, message: error?.message ?? "Unable to submit this attempt." };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Attempt submitted successfully.",
    score: Number(result.score),
    totalMarks: Number(result.total_marks),
    correctAnswers: Number(result.correct_answers),
    incorrectAnswers: Number(result.incorrect_answers),
    unansweredQuestions: Number(result.unanswered_questions),
  };
}
