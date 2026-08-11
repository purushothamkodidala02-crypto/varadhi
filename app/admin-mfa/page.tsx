import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/brand/VaradhiBrand";
import { createClient } from "@/lib/supabase/server";
import { AdminMfaForm } from "./AdminMfaForm";

export const metadata: Metadata = {
  title: "Admin security verification",
  robots: { index: false, follow: false },
};

export default async function AdminMfaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assurance?.currentLevel === "aal2") redirect("/admin");

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-950 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-center">
          <BrandLockup
            context="admin"
            markClassName="h-12 w-12 shrink-0 drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
          />
        </div>

        <div className="mt-9 grid overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/35 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="bg-teal-700 p-7 text-white sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">
              Administrator protection
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              A password is only the first step.
            </h1>
            <p className="mt-4 text-sm leading-6 text-teal-50/90">
              Varadhi requires a fresh six-digit code before opening the admin
              workspace. Student accounts are not affected by this requirement.
            </p>

            <ol className="mt-8 space-y-5 text-sm">
              <SecurityStep number="1" title="Sign in with your password" />
              <SecurityStep number="2" title="Verify your authenticator code" />
              <SecurityStep number="3" title="Enter the protected workspace" />
            </ol>

            <div className="mt-9 rounded-2xl border border-white/15 bg-slate-950/20 p-4 text-xs leading-5 text-teal-50">
              Use Google Authenticator, Microsoft Authenticator, Authy, 1Password,
              or any compatible TOTP application.
            </div>
          </aside>

          <section className="p-6 sm:p-10">
            <AdminMfaForm email={user.email ?? "Administrator"} />
          </section>
        </div>
      </div>
    </main>
  );
}

function SecurityStep({ number, title }: { number: string; title: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 font-black">
        {number}
      </span>
      <span className="font-bold">{title}</span>
    </li>
  );
}
