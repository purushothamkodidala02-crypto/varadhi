"use client";

import { useState } from "react";
import { LongPendingNotice, PendingButtonContent } from "@/components/feedback/LoadingSpinner";

export function DownloadQuestionsButton({ mockTestId }: { mockTestId: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function download() {
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/admin/mock-tests/${mockTestId}/questions-export`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "mock-test-questions.xlsx";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("Question file downloaded.");
    } catch {
      setMessage("The question file could not be downloaded. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex flex-col items-end">
      <button type="button" onClick={download} disabled={pending} aria-busy={pending} className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800 hover:border-teal-400 hover:bg-teal-100 disabled:cursor-wait disabled:opacity-70">
        <PendingButtonContent pending={pending} pendingLabel="Downloading…">Download questions</PendingButtonContent>
      </button>
      <LongPendingNotice pending={pending} />
      {message && <span role="status" aria-live="polite" className={`mt-1 max-w-64 text-right text-xs font-semibold ${message.includes("could not") ? "text-red-700" : "text-emerald-700"}`}>{message}</span>}
    </span>
  );
}
