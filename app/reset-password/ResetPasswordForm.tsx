"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm({ nextPath }: { nextPath: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match. Enter the same password twice.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(
        updateError.code === "same_password"
          ? "Choose a password different from your current password."
          : updateError.code === "weak_password"
            ? "Choose a stronger password and try again."
            : "The reset session has expired. Request a new password-reset link.",
      );
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    window.location.replace(`${loginHref}&reset=1`);
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
          <input
            id="recovery_password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <label htmlFor="confirm_recovery_password" className="block text-sm font-bold text-slate-800">
          Confirm new password
          <input
            id="confirm_recovery_password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter the password again"
            className="mt-2 w-full rounded-xl border px-4 py-3 font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating password…" : "Save new password"}
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
