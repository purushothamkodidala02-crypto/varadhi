"use client";

import Link from "next/link";

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
        href={`/login?next=${encodeURIComponent(`/mock-tests/${testId}/attempt`)}`}
        className="mt-6 block rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200"
      >
        Sign in to start
      </Link>
    );
  }

  if (!hasResumableSession) {
    return (
      <Link
        href={`/mock-tests/${testId}/attempt`}
        className="mt-6 block rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200"
      >
        Start test
      </Link>
    );
  }

  return (
    <div className="mt-6 grid gap-3">
      <Link
        href={`/mock-tests/${testId}/attempt`}
        className="block rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200"
      >
        Resume test
      </Link>
      <Link
        href={`/mock-tests/${testId}/attempt?mode=restart`}
        onClick={(event) => {
          if (!window.confirm("Start this test again? Your unfinished answers and saved time will be cleared.")) {
            event.preventDefault();
          }
        }}
        className="block rounded-xl border border-slate-600 px-5 py-3.5 text-center font-black text-white hover:border-white hover:bg-white/10"
      >
        Start test
      </Link>
    </div>
  );
}
