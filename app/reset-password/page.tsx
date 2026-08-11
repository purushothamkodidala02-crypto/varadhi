import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a New Password",
  robots: { index: false, follow: true },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPath = typeof params.next === "string" ? params.next : undefined;
  const nextPath =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/dashboard";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/forgot-password?next=${encodeURIComponent(nextPath)}&error=invalid`);
  }

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const requiresMfa =
    assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2";

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader compact />
      <div className="mx-auto grid max-w-4xl gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.85fr_1.15fr] md:items-start">
        <aside className="rounded-3xl bg-slate-950 p-7 text-white md:sticky md:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
            Password protection
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Secure your Varadhi Prep account.
          </h1>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-300">
            <li>• Do not reuse a password from another website</li>
            <li>• Avoid names, phone numbers and easy patterns</li>
            <li>• Never share your password or reset link</li>
          </ul>
        </aside>
        <ResetPasswordForm nextPath={nextPath} requiresMfa={requiresMfa} />
      </div>
    </main>
  );
}
