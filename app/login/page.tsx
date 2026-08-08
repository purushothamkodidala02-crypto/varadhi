"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const requestedPath = searchParams.get("next");
  const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/dashboard";

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError || !user) {
      setMessage(loginError?.message ?? "Unable to log in. Please check your email and password.");
      setLoading(false);
      return;
    }
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileError || !profile) {
      setMessage("Login succeeded, but we could not find your account profile. Please contact Varadhi support.");
      setLoading(false);
      return;
    }
    window.location.replace(profile.role === "admin" ? "/admin" : nextPath);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader compact />
      <div className="mx-auto grid max-w-4xl gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.85fr_1.15fr] md:items-start">
        <aside className="rounded-3xl bg-slate-950 p-7 text-white md:sticky md:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">Welcome back</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Continue your preparation.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">Your mock-test dashboard keeps your attempts and subject progress ready for the next study session.</p>
          <Link href="/mock-tests" className="mt-7 inline-flex text-sm font-bold text-teal-200 hover:text-teal-100">Browse available tests →</Link>
        </aside>
        <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Student login</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Sign in to Varadhi</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Use the email and password you chose when registering.</p>
          <form onSubmit={handleLogin} className="mt-7 space-y-5">
            <label htmlFor="email" className="block text-sm font-bold text-slate-800">Email<input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
            <label htmlFor="password" className="block text-sm font-bold text-slate-800">Password<input id="password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
            {message && <p aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message}</p>}
          </form>
          <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">New to Varadhi? <Link href="/register" className="font-bold text-teal-700 hover:text-teal-800">Create your free account</Link></p>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50" />}><LoginForm /></Suspense>;
}
