import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";

export const metadata: Metadata = {
  title: "Confirm Password Recovery",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

function safeNextPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default async function RecoverAccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string | string[];
    next?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const tokenHash =
    typeof params.token_hash === "string" ? params.token_hash : "";
  const nextPath = safeNextPath(
    typeof params.next === "string" ? params.next : undefined,
  );

  if (!tokenHash || tokenHash.length > 2048) {
    redirect(`/forgot-password?next=${encodeURIComponent(nextPath)}&error=invalid`);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader compact />
      <div className="mx-auto grid max-w-4xl gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.85fr_1.15fr] md:items-start">
        <aside className="rounded-3xl bg-teal-700 p-7 text-white md:sticky md:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-100">
            Secure on any device
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Continue to password recovery.
          </h1>
          <p className="mt-4 text-sm leading-6 text-teal-50">
            This one-time link can be opened on your phone, tablet, or computer.
          </p>
        </aside>

        <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">
            Identity confirmation
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Create your new password
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Press the button below to verify this one-time recovery link. It can
            be used only once and expires automatically.
          </p>

          <form action="/auth/recovery" method="post" className="mt-7">
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="next" value={nextPath} />
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              Continue securely
            </button>
          </form>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            If you did not request this password reset, close this page. Your
            password will remain unchanged.
          </p>
        </section>
      </div>
    </main>
  );
}
