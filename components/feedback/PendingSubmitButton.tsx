"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";

export function PendingSubmitButton({
  children,
  pendingLabel,
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col items-start">
      <button
        type="submit"
        disabled={disabled || pending}
        aria-busy={pending}
        className={className}
      >
        <PendingButtonContent pending={pending} pendingLabel={pendingLabel}>{children}</PendingButtonContent>
      </button>
      {pending && <SlowPendingMessage />}
    </div>
  );
}

function SlowPendingMessage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(true), 8000);
    return () => window.clearTimeout(timeout);
  }, []);
  if (!visible) return null;
  return <p role="status" aria-live="polite" className="mt-2 max-w-sm text-xs font-semibold text-amber-700">This is taking longer than expected. Please wait or try again.</p>;
}
