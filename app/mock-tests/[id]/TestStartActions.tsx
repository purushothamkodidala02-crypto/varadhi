"use client";

import Link from "next/link";
import { PendingSubmitButton } from "@/components/feedback/PendingSubmitButton";
import { beginMockTest } from "./start-actions";

export function TestStartActions({
  testId,
  testPath,
  isLoggedIn,
  hasResumableSession,
}: {
  testId: string;
  testPath: string;
  isLoggedIn: boolean;
  hasResumableSession: boolean;
}) {
  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(testPath)}`}
        className="mt-6 block rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200"
      >
        Sign in to start
      </Link>
    );
  }

  if (!hasResumableSession) {
    const startAction = beginMockTest.bind(null, testId, testPath, "resume");
    return (
      <form action={startAction} className="mt-6">
        <PendingSubmitButton pendingLabel="Starting test…" className="block w-full rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200 disabled:cursor-wait disabled:opacity-70">
          Start test
        </PendingSubmitButton>
      </form>
    );
  }

  const resumeAction = beginMockTest.bind(null, testId, testPath, "resume");
  const restartAction = beginMockTest.bind(null, testId, testPath, "restart");

  return (
    <div className="mt-6 grid gap-3">
      <form action={resumeAction}>
        <PendingSubmitButton pendingLabel="Resuming test…" className="block w-full rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200 disabled:cursor-wait disabled:opacity-70">
          Resume test
        </PendingSubmitButton>
      </form>
      <form
        action={restartAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Start this test again? Your unfinished answers and saved time will be cleared.",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <PendingSubmitButton pendingLabel="Restarting test…" className="block w-full rounded-xl border border-slate-600 px-5 py-3.5 text-center font-black text-white hover:border-white hover:bg-white/10 disabled:cursor-wait disabled:opacity-70">
          Start test
        </PendingSubmitButton>
      </form>
    </div>
  );
}
