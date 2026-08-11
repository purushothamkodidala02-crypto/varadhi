"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/auth/PasswordInput";

export function ResetPasswordForm({
  nextPath,
  requiresMfa,
}: {
  nextPath: string;
  requiresMfa: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaRequired, setMfaRequired] = useState(requiresMfa);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [checkingMfa, setCheckingMfa] = useState(requiresMfa);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    if (!mfaRequired || factorId) return;

    let cancelled = false;

    async function loadAuthenticator() {
      setCheckingMfa(true);
      const supabase = createClient();
      const { data, error: factorError } = await supabase.auth.mfa.listFactors();

      if (cancelled) return;

      const verifiedFactor = data?.totp[0];
      if (factorError || !verifiedFactor) {
        setError(
          "Your administrator authenticator could not be loaded. Sign in again and retry the password reset.",
        );
        setCheckingMfa(false);
        return;
      }

      setFactorId(verifiedFactor.id);
      setCheckingMfa(false);
    }

    void loadAuthenticator();

    return () => {
      cancelled = true;
    };
  }, [factorId, mfaRequired]);

  async function finishPasswordUpdate() {
    const supabase = createClient();

    if (mfaRequired) {
      const normalizedCode = mfaCode.replace(/\s/g, "");

      if (!factorId || !/^\d{6}$/.test(normalizedCode)) {
        setError("Enter the current six-digit code from your authenticator app.");
        return false;
      }

      const { error: verificationError } =
        await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: normalizedCode,
        });

      if (verificationError) {
        setMfaCode("");
        setError(
          "That authenticator code is incorrect or has expired. Enter the newest six-digit code.",
        );
        return false;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      if (
        updateError.code === "insufficient_aal" ||
        updateError.message.includes("AAL2")
      ) {
        setMfaRequired(true);
        setError(
          "This administrator account requires its six-digit authenticator code before the password can be changed.",
        );
        return false;
      }

      setError(
        updateError.code === "same_password"
          ? "Choose a password different from your current password."
          : updateError.code === "weak_password"
            ? "Choose a stronger password and try again."
            : "We could not save the new password. Request a new reset email and try again.",
      );
      return false;
    }

    await supabase.auth.signOut();
    window.location.replace(`${loginHref}&reset=1`);
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError("Use a password with at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match. Enter the same password twice.");
      return;
    }

    setLoading(true);
    const completed = await finishPasswordUpdate();
    if (!completed) setLoading(false);
  }

  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
        Final step
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        Create a new password
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Choose a password you have not used before and keep it private.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <label htmlFor="recovery_password" className="block text-sm font-bold text-slate-800">
          New password
          <PasswordInput
            id="recovery_password"
            required
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 10 characters"
          />
        </label>
        <label htmlFor="confirm_recovery_password" className="block text-sm font-bold text-slate-800">
          Confirm new password
          <PasswordInput
            id="confirm_recovery_password"
            required
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter the password again"
          />
        </label>

        {mfaRequired && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">
              Administrator verification
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              This account has MFA protection. Enter the current code from your
              authenticator app before saving the new password.
            </p>
            <label
              htmlFor="recovery_mfa_code"
              className="mt-4 block text-sm font-bold text-slate-800"
            >
              Six-digit authenticator code
              <input
                id="recovery_mfa_code"
                type="text"
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(event) =>
                  setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="mt-2 w-full rounded-xl border border-teal-200 bg-white px-4 py-3 text-center font-mono text-xl font-black tracking-[0.35em] outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </label>
            {checkingMfa && (
              <p className="mt-3 text-xs font-semibold text-teal-800">
                Checking authenticator protection…
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            loading ||
            checkingMfa ||
            (mfaRequired && (!factorId || mfaCode.length !== 6))
          }
          className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? mfaRequired
              ? "Verifying and updating…"
              : "Updating password…"
            : mfaRequired
              ? "Verify code and save new password"
              : "Save new password"}
        </button>
        {error && (
          <p
            aria-live="polite"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">
        Need a new reset link?{" "}
        <Link
          href={`/forgot-password?next=${encodeURIComponent(nextPath)}`}
          className="font-bold text-teal-700 hover:text-teal-800"
        >
          Request another email
        </Link>
      </p>
    </section>
  );
}
