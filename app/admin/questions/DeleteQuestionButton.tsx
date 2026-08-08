"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestion } from "./deleteAction";

type DeleteQuestionButtonProps = {
  questionId: string;
  questionText: string;
};

export function DeleteQuestionButton({
  questionId,
  questionText,
}: DeleteQuestionButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete this question?\n\n${questionText}`
    );

    if (!confirmed) {
      return;
    }

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
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>

      {message && (
        <p className="mt-2 max-w-xs text-xs leading-normal text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
