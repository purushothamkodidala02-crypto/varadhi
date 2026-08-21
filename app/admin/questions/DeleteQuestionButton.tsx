"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";
import { deleteQuestion, makeQuestionUnavailable } from "./deleteAction";

type DeleteQuestionButtonProps = { questionId: string; questionText: string };

export function DeleteQuestionButton({ questionId, questionText }: DeleteQuestionButtonProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"unavailable" | "delete" | null>(null);
  const [message, setMessage] = useState("");

  async function run(mode: "unavailable" | "delete") {
    const prompt = mode === "unavailable"
      ? `Make this Question unavailable for future use?\n\n${questionText}\n\nExisting attempts and reviews remain safe.`
      : `Permanently delete this Question and its uploaded image?\n\n${questionText}\n\nDeletion is blocked if any mock test or retained review still needs it.`;
    if (!window.confirm(prompt)) return;
    setPendingAction(mode); setMessage("");
    const result = mode === "unavailable" ? await makeQuestionUnavailable(questionId) : await deleteQuestion(questionId);
    setMessage(result.message); setPendingAction(null);
    if (result.success) router.refresh();
  }

  return <div className="flex flex-col items-end"><div className="flex flex-wrap justify-end gap-1"><button type="button" onClick={() => run("unavailable")} disabled={pendingAction !== null} aria-busy={pendingAction === "unavailable"} className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"><PendingButtonContent pending={pendingAction === "unavailable"} pendingLabel="Updating…">Make unavailable</PendingButtonContent></button><button type="button" onClick={() => run("delete")} disabled={pendingAction !== null} aria-busy={pendingAction === "delete"} className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><PendingButtonContent pending={pendingAction === "delete"} pendingLabel="Deleting…">Delete permanently</PendingButtonContent></button></div>{message && <p aria-live="polite" className="mt-2 max-w-sm text-right text-xs leading-5 text-red-700">{message}</p>}</div>;
}
