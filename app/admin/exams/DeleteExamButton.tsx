"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteExam } from "./deleteAction";

type DeleteExamButtonProps = {
  examId: string;
  examName: string;
};

export function DeleteExamButton({
  examId,
  examName,
}: DeleteExamButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${examName}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setPending(true);
    setMessage("");

    const result = await deleteExam(examId);

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
        className="inline-flex h-6 items-center text-sm font-medium leading-none text-red-600 hover:underline disabled:opacity-50"
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