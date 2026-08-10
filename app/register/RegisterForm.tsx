"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Notice = {
  tone: "error" | "success" | "info";
  message: string;
};

const noticeStyles = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  function confirmationRedirectUrl() {
    const redirectUrl = new URL("/login", window.location.origin);
    redirectUrl.searchParams.set("next", nextPath);
    redirectUrl.searchParams.set("confirmed", "1");
    return redirectUrl.toString();
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: confirmationRedirectUrl(),
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      const mayAlreadyExist =
        error.code === "user_already_exists" ||
        /already registered|already exists/i.test(error.message);
      setNotice({
        tone: "error",
        message: mayAlreadyExist
          ? "This email may already have a Varadhi account. Try signing in instead."
          : error.code === "over_email_send_rate_limit"
            ? "Too many confirmation emails were requested. Wait a few minutes, then try again."
            : "We could not create the account right now. Check the details and try again.",
      });
      setLoading(false);
      return;
    }

    if (data.user?.identities?.length === 0) {
      setNotice({
        tone: "error",
        message:
          "This email may already have a Varadhi account. Sign in with your existing password instead.",
      });
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.replace(nextPath);
      return;
    }

    setEmail(normalizedEmail);
    setAwaitingConfirmation(true);
    setNotice({
      tone: "success",
      message: "Your account was created. Confirm your email before signing in.",
    });
    setLoading(false);
  }

  async function resendConfirmation() {
    setResending(true);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: confirmationRedirectUrl() },
    });

    setNotice(
      error
        ? {
            tone: "error",
            message:
              error.code === "over_email_send_rate_limit"
                ? "Please wait a few minutes before requesting another email."
                : "We could not resend the confirmation email. Please try again shortly.",
          }
        : {
            tone: "success",
            message: "A new confirmation email was requested. Check your inbox and spam folder.",
          },
    );
    setResending(false);
  }

  function useDifferentEmail() {
    setAwaitingConfirmation(false);
    setPassword("");
    setNotice(null);
  }

  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
        Student registration
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {awaitingConfirmation ? "Confirm your email" : "Create your account"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {awaitingConfirmation
          ? `We sent the next step to ${email}.`
          : "Create one account, then use it for every free Varadhi mock test."}
      </p>

      {awaitingConfirmation ? (
        <div className="mt-7">
          <ol className="space-y-3 text-sm leading-6 text-slate-700">
            <li className="flex gap-3 rounded-2xl bg-slate-50 p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-950 text-xs font-black text-white">1</span>
              Open the Varadhi confirmation email. Check the spam folder if it is not in your inbox.
            </li>
            <li className="flex gap-3 rounded-2xl bg-slate-50 p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-teal-700 text-xs font-black text-white">2</span>
              Confirm the email, sign in, and you will return to the test you selected.
            </li>
          </ol>
          {notice && (
            <p aria-live="polite" className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${noticeStyles[notice.tone]}`}>
              {notice.message}
            </p>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href={loginHref} className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white hover:bg-slate-800">
              Go to sign in
            </Link>
            <button type="button" onClick={resendConfirmation} disabled={resending} className="rounded-xl border px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {resending ? "Requesting…" : "Resend email"}
            </button>
          </div>
          <button type="button" onClick={useDifferentEmail} className="mt-4 w-full text-sm font-bold text-teal-700 hover:text-teal-800">
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="mt-7 space-y-5">
          <label htmlFor="full_name" className="block text-sm font-bold text-slate-800">
            Full name
            <input id="full_name" type="text" required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
          </label>
          <label htmlFor="register_email" className="block text-sm font-bold text-slate-800">
            Email
            <input id="register_email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
          </label>
          <label htmlFor="new_password" className="block text-sm font-bold text-slate-800">
            Password
            <input id="new_password" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
            <span className="mt-2 block text-xs font-normal text-slate-500">Use at least 6 characters and keep this password private.</span>
          </label>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Creating account…" : "Create free account"}
          </button>
          {notice && (
            <p aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-medium ${noticeStyles[notice.tone]}`}>
              {notice.message}
            </p>
          )}
        </form>
      )}

      {!awaitingConfirmation && (
        <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">
          Already registered?{" "}
          <Link href={loginHref} className="font-bold text-teal-700 hover:text-teal-800">
            Sign in to your account
          </Link>
        </p>
      )}
    </section>
  );
}
