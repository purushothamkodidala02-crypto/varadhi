"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Notice = {
  tone: "error" | "success";
  message: string;
};

const noticeStyles = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function ForgotPasswordForm({
  nextPath,
  initialError,
}: {
  nextPath: string;
  initialError?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(
    initialError ? { tone: "error", message: initialError } : null,
  );
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  function recoveryRedirectUrl() {
    const redirectUrl = new URL("/auth/recovery", window.location.origin);
    redirectUrl.searchParams.set("next", nextPath);
    return redirectUrl.toString();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: recoveryRedirectUrl() },
    );

    if (error?.code === "over_email_send_rate_limit") {
      setNotice({
        tone: "error",
        message: "Too many reset emails were requested. Wait a few minutes, then try again.",
      });
    } else if (error) {
      setNotice({
        tone: "error",
        message: "We could not request a password reset right now. Please try again shortly.",
      });
    } else {
      setNotice({
        tone: "success",
        message:
          "If this email has a Varadhi account, a password-reset link has been sent. Check the inbox and spam folder.",
      });
    }

    setLoading(false);
  }

  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
        Account recovery
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        Reset your password
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Enter the email used for your Varadhi account. We will send a secure reset link.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <label htmlFor="recovery_email" className="block text-sm font-bold text-slate-800">
          Registered email
          <input
            id="recovery_email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending reset link…" : "Send password-reset link"}
        </button>
        {notice && (
          <p
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${noticeStyles[notice.tone]}`}
          >
            {notice.message}
          </p>
        )}
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">
        Remembered your password?{" "}
        <Link href={loginHref} className="font-bold text-teal-700 hover:text-teal-800">
          Return to sign in
        </Link>
      </p>
    </section>
  );
}
