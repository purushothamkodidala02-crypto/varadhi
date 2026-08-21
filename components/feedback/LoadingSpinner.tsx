"use client";

import { useEffect, useState } from "react";

type LoadingSpinnerProps = {
  className?: string;
};

export function LongPendingNotice({ pending }: { pending: boolean }) {
  return pending ? <LongPendingNoticeTimer /> : null;
}

function LongPendingNoticeTimer() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(true), 8000);
    return () => window.clearTimeout(timeout);
  }, []);
  if (!visible) return null;
  return <p role="status" aria-live="polite" className="mt-2 text-xs font-semibold text-amber-700">This is taking longer than expected. Please wait or try again.</p>;
}

export function LoadingSpinner({ className = "h-4 w-4" }: LoadingSpinnerProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`shrink-0 animate-spin motion-reduce:animate-none ${className}`}
    >
      <circle cx="12" cy="12" r="9" className="fill-none stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="fill-none stroke-current opacity-90" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

export function PendingButtonContent({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-grid min-w-0 grid-flow-col items-center justify-center gap-2">
      <span className="grid h-4 w-4 place-items-center">
        {pending ? <LoadingSpinner /> : null}
      </span>
      <span>{pending ? pendingLabel : children}</span>
    </span>
  );
}
