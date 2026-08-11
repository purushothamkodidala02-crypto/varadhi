"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { TurnstileChallenge } from "@/components/auth/TurnstileChallenge";

type Notice = {
  tone: "error" | "success" | "info";
  message: string;
};

const noticeStyles = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function LoginForm({
  nextPath,
  initialMessage,
}: {
  nextPath: string;
  initialMessage?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<Notice | null>(
    initialMessage ? { tone: "success", message: initialMessage } : null,
  );
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const registerHref = `/register?next=${encodeURIComponent(nextPath)}`;
  const forgotPasswordHref = `/forgot-password?next=${encodeURIComponent(nextPath)}`;

  function confirmationRedirectUrl() {
    const redirectUrl = new URL("/login", window.location.origin);
    redirectUrl.searchParams.set("next", nextPath);
    redirectUrl.searchParams.set("confirmed", "1");
    return redirectUrl.toString();
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNeedsConfirmation(false);
    setNotice(null);
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
      options: { captchaToken: captchaToken ?? undefined },
    });

    setCaptchaToken(null);
    setCaptchaResetKey((value) => value + 1);

    if (loginError || !user) {
      const emailNotConfirmed = loginError?.code === "email_not_confirmed";
      setNeedsConfirmation(emailNotConfirmed);
      setNotice({
        tone: emailNotConfirmed ? "info" : "error",
        message: emailNotConfirmed
          ? "Your account exists, but the email is not confirmed yet. Confirm it or request a new email below."
          : loginError?.code === "over_request_rate_limit"
            ? "Too many sign-in attempts. Wait a few minutes, then try again."
            : "The email or password is incorrect. Check both fields and try again.",
      });
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      setNotice({
        tone: "error",
        message:
          "You are signed in, but the student profile could not be loaded. Please sign out and try once more.",
      });
      setLoading(false);
      return;
    }

    if (profile.role === "admin") {
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assuranceError) {
        setNotice({
          tone: "error",
          message: "Your password was accepted, but administrator security could not be checked. Please try again.",
        });
        setLoading(false);
        return;
      }

      window.location.replace(
        assurance?.currentLevel === "aal2" ? "/admin" : "/admin-mfa",
      );
      return;
    }

    window.location.replace(nextPath);
  }

  async function resendConfirmation() {
    if (!email.trim()) {
      setNotice({ tone: "error", message: "Enter your email address first." });
      return;
    }

    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: confirmationRedirectUrl(),
        captchaToken: captchaToken ?? undefined,
      },
    });

    setCaptchaToken(null);
    setCaptchaResetKey((value) => value + 1);

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

  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
        Student login
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        Sign in to continue
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Use the same email and password you entered during registration.
      </p>
      <form onSubmit={handleLogin} className="mt-7 space-y-5">
        <label htmlFor="login_email" className="block text-sm font-bold text-slate-800">
          Email
          <input id="login_email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
        </label>
        <div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="current_password" className="text-sm font-bold text-slate-800">
              Password
            </label>
            <Link
              href={forgotPasswordHref}
              className="text-xs font-bold text-teal-700 hover:text-teal-800"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="current_password" required maxLength={72} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
        </div>
        <TurnstileChallenge onToken={setCaptchaToken} resetKey={captchaResetKey} />
        <button type="submit" disabled={loading || !captchaToken} className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in and continue"}
        </button>
        {notice && (
          <p aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-medium ${noticeStyles[notice.tone]}`}>
            {notice.message}
          </p>
        )}
        {needsConfirmation && (
          <button type="button" onClick={resendConfirmation} disabled={resending || !captchaToken} className="w-full rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800 hover:bg-teal-100 disabled:opacity-50">
            {resending ? "Requesting confirmation…" : "Resend confirmation email"}
          </button>
        )}
      </form>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-sm text-slate-600">
          New to Varadhi Prep?{" "}
          <Link href={registerHref} className="font-bold text-teal-700 hover:text-teal-800">
            Create a free account
          </Link>
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          After signing in, you will return to the mock test you selected.
        </p>
      </div>
    </section>
  );
}
