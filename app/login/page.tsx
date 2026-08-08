"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const requestedPath = searchParams.get("next");
  const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/dashboard";

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !user) {
      setMessage(loginError?.message ?? "Unable to log in.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      setMessage(
        "Login succeeded, but your profile role could not be found."
      );
      setLoading(false);
      return;
    }

    if (profile.role === "admin") {
      window.location.replace("/admin");
      return;
    }

    window.location.replace(nextPath);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Login</h1>

      <p className="mt-2 text-gray-600">
        Login to access mock tests and your dashboard.
      </p>

      <form onSubmit={handleLogin} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && (
          <p className="text-sm text-red-600">{message}</p>
        )}

        <p className="text-sm text-gray-600">
          New to Varadhi? <Link href="/register" className="font-medium text-black underline">Create an account</Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-6 py-16" />}>
      <LoginForm />
    </Suspense>
  );
}
