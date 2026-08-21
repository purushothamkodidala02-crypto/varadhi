"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";
import { deleteQuestion } from "./deleteAction";

type DeleteQuestionButtonProps = { questionId: string; questionText: string };

export function DeleteQuestionButton({ questionId, questionText }: DeleteQuestionButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    if (!window.confirm(`Remove this question from the library?\n\n${questionText}\n\nQuestions already used in a mock test cannot be removed.`)) return;
    setPending(true);
    setMessage("");
    const result = await deleteQuestion(questionId);
    if (!result.success) {
      setMessage(result.message);
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start">
      <button type="button" onClick={handleDelete} disabled={pending} aria-busy={pending} className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
        <PendingButtonContent pending={pending} pendingLabel="Removing…">Remove</PendingButtonContent>
      </button>
      {message && <p className="mt-2 max-w-xs text-xs leading-5 text-red-700">{message}</p>}
    </div>
  );
}
