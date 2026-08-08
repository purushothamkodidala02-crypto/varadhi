"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MockTestStatus } from "@/types/mock-test";
import { archiveMockTest, deleteDraftMockTest, restoreMockTestAsDraft } from "./manage-actions";

type MockTestManagementButtonsProps = {
  mockTestId: string;
  mockTestTitle: string;
  status: MockTestStatus;
};

export function MockTestManagementButtons({ mockTestId, mockTestTitle, status }: MockTestManagementButtonsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAction() {
    const confirmation = status === "published"
      ? `Archive “${mockTestTitle}”?\n\nIt will be hidden from students and new attempts will stop. Existing results stay safe.`
      : status === "archived"
        ? `Restore “${mockTestTitle}” as a draft?\n\nIt will remain hidden from students until you publish it again.`
        : `Delete draft “${mockTestTitle}”?\n\nIts assigned questions will be removed from this draft, but the original questions stay in the question bank.`;

    if (!window.confirm(confirmation)) return;

    setPending(true);
    setMessage("");
    const result = status === "published"
      ? await archiveMockTest(mockTestId)
      : status === "archived"
        ? await restoreMockTestAsDraft(mockTestId)
        : await deleteDraftMockTest(mockTestId);

    if (!result.success) {
      setMessage(result.message);
      setPending(false);
      return;
    }

    router.refresh();
  }

  const buttonLabel = status === "published" ? "Archive" : status === "archived" ? "Restore as draft" : "Delete draft";
  const buttonClass = status === "draft"
    ? "text-red-700 hover:bg-red-50"
    : status === "published"
      ? "text-amber-800 hover:bg-amber-50"
      : "text-teal-700 hover:bg-teal-50";

  return (
    <div className="flex flex-col items-start">
      <button type="button" onClick={handleAction} disabled={pending} className={`rounded-lg px-2.5 py-1.5 text-sm font-bold disabled:opacity-50 ${buttonClass}`}>
        {pending ? "Working…" : buttonLabel}
      </button>
      {message && <p className="mt-2 max-w-56 text-xs leading-5 text-red-700">{message}</p>}
    </div>
  );
}
