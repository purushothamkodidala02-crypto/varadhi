"use client";

import { useTransition } from "react";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";

export function RetryButton({ retry, className }: { retry: () => void; className: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" onClick={() => startTransition(retry)} disabled={pending} aria-busy={pending} className={className}>
      <PendingButtonContent pending={pending} pendingLabel="Trying again…">Try again</PendingButtonContent>
    </button>
  );
}

