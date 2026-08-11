"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Answer = "A" | "B" | "C" | "D";

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

  for (const [questionId, answer] of Object.entries(answers)) {
    if (!questionId || !validAnswers.has(answer)) {
      return null;
    }
    cleanedAnswers[questionId] = answer;
  }

  return cleanedAnswers;
}

export async function saveAttemptProgress(
  sessionId: string,
  answers: Record<string, Answer>
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cleanedAnswers = cleanAnswers(answers);
  if (!user || !sessionId || !cleanedAnswers) {
    return { success: false };
  }

  const { error } = await supabase.rpc("save_mock_test_session_answers", {
    requested_session_id: sessionId,
    submitted_answers: cleanedAnswers,
  });

  return { success: !error };
}

export async function syncAttemptTimer(sessionId: string): Promise<{ success: boolean; remaining?: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !sessionId) return { success: false };
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
  if (!user || !sessionId || !cleanedAnswers) {
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
    ? { success: false, message: pauseError.message }
    : { success: true, message: "Practice paused. Resume whenever you are ready.", remaining: Number(pausedSeconds) };
}

export async function resumeAttempt(mockTestId: string, sessionId: string): Promise<{ success: boolean; message: string; expiresAt?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !mockTestId || !sessionId) return { success: false, message: "Unable to resume this attempt." };
  const { data, error } = await supabase.rpc("start_mock_test_session", {
    requested_mock_test_id: mockTestId,
  });
  const resumed = data?.[0] as { session_id: string; expires_at: string } | undefined;
  if (error || !resumed || resumed.session_id !== sessionId) {
    return { success: false, message: error?.message ?? "This attempt could not be resumed." };
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
  if (!sessionId || !cleanedAnswers) {
    return { success: false, message: "One or more submitted answers are invalid." };
  }

  const { data, error } = await supabase.rpc("submit_mock_test_attempt", {
    requested_session_id: sessionId,
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
    attemptId: String(result.attempt_id),
    score: Number(result.score),
    totalMarks: Number(result.total_marks),
    correctAnswers: Number(result.correct_answers),
    incorrectAnswers: Number(result.incorrect_answers),
    unansweredQuestions: Number(result.unanswered_questions),
  };
}
