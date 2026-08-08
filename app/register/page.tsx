"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login`, data: { full_name: fullName } },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setMessage("Account created. Check your email to confirm your address, then return here to log in.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader compact />
      <div className="mx-auto grid max-w-4xl gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.85fr_1.15fr] md:items-start">
        <aside className="rounded-3xl bg-teal-700 p-7 text-white md:sticky md:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-100">Start free</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Make every practice session count.</h1>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-teal-50"><li>• Explore Group and job-wise mock tests</li><li>• Take timed tests with saved progress</li><li>• Review attempts and subject accuracy</li></ul>
        </aside>
        <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Student registration</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Create your account</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">It takes less than a minute. You can start with any published free mock test.</p>
          <form onSubmit={handleRegister} className="mt-7 space-y-5">
            <label htmlFor="full_name" className="block text-sm font-bold text-slate-800">Full name<input id="full_name" type="text" required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
            <label htmlFor="email" className="block text-sm font-bold text-slate-800">Email<input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
            <label htmlFor="password" className="block text-sm font-bold text-slate-800">Password<input id="password" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Creating account…" : "Create free account"}</button>
            {message && <p aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-medium ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</p>}
          </form>
          <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">Already have an account? <Link href="/login" className="font-bold text-teal-700 hover:text-teal-800">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
