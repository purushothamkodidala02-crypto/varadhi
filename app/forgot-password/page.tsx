import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: true },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const requestedPath = typeof params.next === "string" ? params.next : undefined;
  const nextPath =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/dashboard";
  const initialError =
    params.error === "invalid"
      ? "This reset link is invalid or has expired. Request a new link below."
      : undefined;

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader compact />
      <div className="mx-auto grid max-w-4xl gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.85fr_1.15fr] md:items-start">
        <aside className="rounded-3xl bg-teal-700 p-7 text-white md:sticky md:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-100">
            Secure recovery
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Return to your preparation.
          </h1>
          <p className="mt-4 text-sm leading-6 text-teal-50">
            The reset link can be used only for the account connected to your registered email.
          </p>
          <Link
            href="/mock-tests"
            className="mt-7 inline-flex text-sm font-bold text-teal-100 hover:text-white"
          >
            Browse available tests →
          </Link>
        </aside>
        <ForgotPasswordForm nextPath={nextPath} initialError={initialError} />
      </div>
    </main>
  );
}
