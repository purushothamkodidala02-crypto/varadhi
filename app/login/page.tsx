import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Student Login",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; confirmed?: string | string[] }>;
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
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    redirect(profile?.role === "admin" ? "/admin" : nextPath);
  }
  const initialMessage =
    params.confirmed === "1"
      ? "Email confirmed. Sign in to continue to your mock test."
      : undefined;

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader compact />
      <div className="mx-auto grid max-w-4xl gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.85fr_1.15fr] md:items-start">
        <aside className="rounded-3xl bg-slate-950 p-7 text-white md:sticky md:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Continue your preparation.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Your mock-test dashboard keeps your attempts and subject progress ready
            for the next study session.
          </p>
          <Link
            href="/mock-tests"
            className="mt-7 inline-flex text-sm font-bold text-teal-200 hover:text-teal-100"
          >
            Browse available tests →
          </Link>
        </aside>
        <LoginForm nextPath={nextPath} initialMessage={initialMessage} />
      </div>
    </main>
  );
}
