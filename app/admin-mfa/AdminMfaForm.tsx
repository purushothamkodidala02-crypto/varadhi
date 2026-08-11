"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import LogoutButton from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/client";

type Stage = "checking" | "setup" | "enroll" | "verify";

type Notice = {
  tone: "error" | "info" | "success";
  message: string;
};

const noticeStyles = {
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function AdminMfaForm({ email }: { email: string }) {
  const initialized = useRef(false);
  const [stage, setStage] = useState<Stage>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [factorName, setFactorName] = useState("Varadhi Admin");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const qrSource = useMemo(() => {
    if (!qrCode) return null;
    return qrCode.startsWith("data:")
      ? qrCode
      : `data:image/svg+xml;utf8,${encodeURIComponent(qrCode)}`;
  }, [qrCode]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function inspectFactors() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        setNotice({
          tone: "error",
          message: "We could not check your administrator security setup. Sign out and try again.",
        });
        setStage("setup");
        return;
      }

      const verifiedFactor = data.totp[0];
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
        setFactorName(verifiedFactor.friendly_name || "Varadhi Admin");
        setStage("verify");
        return;
      }

      setStage("setup");
    }

    void inspectFactors();
  }, []);

  async function startEnrollment() {
    setLoading(true);
    setNotice(null);
    const supabase = createClient();
    const factors = await supabase.auth.mfa.listFactors();

    if (factors.error) {
      setNotice({ tone: "error", message: "Unable to begin MFA setup. Please try again." });
      setLoading(false);
      return;
    }

    const staleFactors = factors.data.all.filter(
      (factor) => factor.factor_type === "totp" && factor.status === "unverified",
    );

    for (const factor of staleFactors) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Varadhi Admin",
      issuer: "Varadhi Prep",
    });

    if (error || !data || data.type !== "totp") {
      setNotice({
        tone: "error",
        message: "Authenticator setup could not be created. Wait a moment and try again.",
      });
      setLoading(false);
      return;
    }

    setFactorId(data.id);
    setFactorName(data.friendly_name || "Varadhi Admin");
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStage("enroll");
    setNotice({
      tone: "info",
      message: "Scan the QR code, then enter the six-digit code shown in your authenticator app.",
    });
    setLoading(false);
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.replace(/\s/g, "");

    if (!factorId || !/^\d{6}$/.test(normalizedCode)) {
      setNotice({ tone: "error", message: "Enter the complete six-digit authenticator code." });
      return;
    }

    setLoading(true);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: normalizedCode,
    });

    if (error) {
      setCode("");
      setNotice({
        tone: "error",
        message: "That code is incorrect or has expired. Enter the newest code from your authenticator app.",
      });
      setLoading(false);
      return;
    }

    const { data: assurance, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError || assurance?.currentLevel !== "aal2") {
      setNotice({
        tone: "error",
        message: "The code was accepted, but the secure session was not completed. Please verify once more.",
      });
      setLoading(false);
      return;
    }

    setNotice({ tone: "success", message: "Administrator identity verified. Opening Varadhi…" });
    window.location.replace("/admin");
  }

  async function copySecret() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (stage === "checking") {
    return (
      <div className="grid min-h-96 place-items-center text-center">
        <div>
          <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
          <p className="mt-4 text-sm font-bold text-slate-600">Checking administrator security…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">
            Secure admin access
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            {stage === "verify" ? "Enter your security code" : stage === "enroll" ? "Connect an authenticator" : "Set up administrator MFA"}
          </h2>
          <p className="mt-2 max-w-md truncate text-sm text-slate-500">{email}</p>
        </div>
        <LogoutButton />
      </div>

      {stage === "setup" && (
        <div className="mt-8">
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
            <ShieldIcon />
            <h3 className="mt-4 text-lg font-black">Protect this administrator account</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              You will scan one QR code. After setup, your authenticator app creates a
              new six-digit code every 30 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={startEnrollment}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating secure setup…" : "Set up authenticator app"}
          </button>
        </div>
      )}

      {stage === "enroll" && qrSource && (
        <div className="mt-7">
          <div className="mx-auto w-fit rounded-2xl border bg-white p-4 shadow-sm">
            <Image
              src={qrSource}
              alt="Varadhi administrator authenticator QR code"
              width={220}
              height={220}
              unoptimized
              priority
            />
          </div>

          <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-bold text-slate-700">
              Cannot scan? Enter the setup key manually
            </summary>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700">
                {secret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="rounded-lg border bg-white px-3 py-2 text-xs font-black text-teal-700 hover:bg-teal-50"
              >
                {copied ? "Copied" : "Copy key"}
              </button>
            </div>
          </details>
        </div>
      )}

      {(stage === "enroll" || stage === "verify") && (
        <form onSubmit={verifyCode} className="mt-7">
          {stage === "verify" && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Authenticator
              </p>
              <p className="mt-2 font-black text-slate-900">{factorName}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Open your authenticator app and enter the current code for Varadhi Prep.
              </p>
            </div>
          )}

          <label htmlFor="admin_mfa_code" className="block text-sm font-black text-slate-800">
            Six-digit code
          </label>
          <input
            id="admin_mfa_code"
            type="text"
            required
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-center font-mono text-2xl font-black tracking-[0.4em] outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="mt-4 w-full rounded-xl bg-teal-700 px-5 py-3.5 font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying…" : stage === "enroll" ? "Verify and activate MFA" : "Verify and open admin"}
          </button>
        </form>
      )}

      {notice && (
        <p
          aria-live="polite"
          className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold leading-5 ${noticeStyles[notice.tone]}`}
        >
          {notice.message}
        </p>
      )}

      <p className="mt-6 text-center text-xs leading-5 text-slate-500">
        This verification protects exam content, publishing controls, and student results.
      </p>
    </div>
  );
}

function ShieldIcon() {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-900/15">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3 5.5 5.7v5.8c0 4.1 2.6 7.7 6.5 9.5 3.9-1.8 6.5-5.4 6.5-9.5V5.7L12 3Z" />
        <path d="m9.3 12.2 1.7 1.7 3.8-4" />
      </svg>
    </span>
  );
}
