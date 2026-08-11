"use client";

import Link from "next/link";
import { beginMockTest } from "./start-actions";

export function TestStartActions({
  testId,
  isLoggedIn,
  hasResumableSession,
}: {
  testId: string;
  isLoggedIn: boolean;
  hasResumableSession: boolean;
}) {
  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/mock-tests/${testId}`)}`}
        className="mt-6 block rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200"
      >
        Sign in to start
      </Link>
    );
  }

  if (!hasResumableSession) {
    const startAction = beginMockTest.bind(null, testId, "resume");
    return (
      <form action={startAction} className="mt-6">
        <button
          type="submit"
          className="block w-full rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200"
        >
          Start test
        </button>
      </form>
    );
  }

  const resumeAction = beginMockTest.bind(null, testId, "resume");
  const restartAction = beginMockTest.bind(null, testId, "restart");

  return (
    <div className="mt-6 grid gap-3">
      <form action={resumeAction}>
        <button
          type="submit"
          className="block w-full rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200"
        >
          Resume test
        </button>
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
        <button
          type="submit"
          className="block w-full rounded-xl border border-slate-600 px-5 py-3.5 text-center font-black text-white hover:border-white hover:bg-white/10"
        >
          Start test
        </button>
      </form>
    </div>
  );
}
