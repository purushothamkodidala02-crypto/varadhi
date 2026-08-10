import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
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
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
