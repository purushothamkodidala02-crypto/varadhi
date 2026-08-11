"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Answer = "A" | "B" | "C" | "D";
const MAX_ANSWERS_PER_ATTEMPT = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SubmitAttemptResult = {
  success: boolean;
  message: string;
  attemptId?: string;
  score?: number;
  totalMarks?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  unansweredQuestions?: number;
};

function cleanAnswers(answers: Record<string, Answer>) {
  const validAnswers = new Set<Answer>(["A", "B", "C", "D"]);
  const cleanedAnswers: Record<string, Answer> = {};

  const entries = Object.entries(answers);
  if (entries.length > MAX_ANSWERS_PER_ATTEMPT) return null;

  for (const [questionId, answer] of entries) {
    if (!UUID_PATTERN.test(questionId) || !validAnswers.has(answer)) {
      return null;
    }
    cleanedAnswers[questionId] = answer;
  }

  return cleanedAnswers;
}

export async function saveAttemptProgress(
  sessionId: string,
  questionId: string,
  answer: Answer | null,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    !UUID_PATTERN.test(sessionId) ||
    !UUID_PATTERN.test(questionId) ||
    (answer !== null && !["A", "B", "C", "D"].includes(answer))
  ) {
    return { success: false };
  }

  const { error } = await supabase.rpc("save_mock_test_answer_update", {
    requested_session_id: sessionId,
    requested_question_id: questionId,
    requested_answer: answer,
  });

  return { success: !error };
}

export async function saveReviewState(
  sessionId: string,
  questionId: string,
  marked: boolean,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !UUID_PATTERN.test(sessionId) || !UUID_PATTERN.test(questionId)) {
    return { success: false };
  }

  const { error } = await supabase.rpc("save_mock_test_review_mark", {
    requested_session_id: sessionId,
    requested_question_id: questionId,
    requested_mark: marked,
  });
  return { success: !error };
}

export async function syncAttemptTimer(sessionId: string): Promise<{ success: boolean; remaining?: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !UUID_PATTERN.test(sessionId)) return { success: false };
  const { data, error } = await supabase.rpc("sync_mock_test_session_timer", {
    requested_session_id: sessionId,
  });
  return error ? { success: false } : { success: true, remaining: Number(data) };
}

export async function pauseAttempt(
  sessionId: string,
  answers: Record<string, Answer>,
): Promise<{ success: boolean; message: string; remaining?: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cleanedAnswers = cleanAnswers(answers);
  if (!user || !UUID_PATTERN.test(sessionId) || !cleanedAnswers) {
    return { success: false, message: "Unable to pause this attempt." };
  }

  const { error: answersError } = await supabase.rpc("save_mock_test_session_answers", {
    requested_session_id: sessionId,
    submitted_answers: cleanedAnswers,
  });
  if (answersError) return { success: false, message: "Your latest answers could not be saved." };

  const { data: pausedSeconds, error: pauseError } = await supabase.rpc("pause_mock_test_session", {
    requested_session_id: sessionId,
  });
  return pauseError
    ? { success: false, message: "The attempt could not be paused. Refresh the page and try again." }
    : { success: true, message: "Practice paused. Resume whenever you are ready.", remaining: Number(pausedSeconds) };
}

export async function resumeAttempt(mockTestId: string, sessionId: string): Promise<{ success: boolean; message: string; expiresAt?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !UUID_PATTERN.test(mockTestId) || !UUID_PATTERN.test(sessionId)) return { success: false, message: "Unable to resume this attempt." };
  const { data, error } = await supabase.rpc("start_mock_test_session", {
    requested_mock_test_id: mockTestId,
  });
  const resumed = data?.[0] as { session_id: string; expires_at: string } | undefined;
  if (error || !resumed || resumed.session_id !== sessionId) {
    return { success: false, message: "This attempt could not be resumed. Return to the test details and try again." };
  }
  return { success: true, message: "Practice resumed.", expiresAt: resumed.expires_at };
}

export async function submitAttempt(
  sessionId: string,
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

  const cleanedAnswers = cleanAnswers(answers);
  if (!UUID_PATTERN.test(sessionId) || !cleanedAnswers) {
    return { success: false, message: "One or more submitted answers are invalid." };
  }

  const { data, error } = await supabase.rpc("submit_mock_test_attempt", {
    requested_session_id: sessionId,
    submitted_answers: cleanedAnswers,
  });

  const result = data?.[0];
  if (error || !result) {
    return { success: false, message: "Unable to submit this attempt right now. Your saved answers are still protected; try again." };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Attempt submitted successfully.",
    attemptId: String(result.attempt_id),
    score: Number(result.score),
    totalMarks: Number(result.total_marks),
    correctAnswers: Number(result.correct_answers),
    incorrectAnswers: Number(result.incorrect_answers),
    unansweredQuestions: Number(result.unanswered_questions),
  };
}
