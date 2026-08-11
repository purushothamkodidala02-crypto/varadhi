import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <PublicHeader />
      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center sm:py-32">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">404 · Page not found</p>
        <h1 className="font-display mt-4 text-4xl sm:text-5xl">This page is not available.</h1>
        <p className="mt-5 max-w-xl leading-7 text-slate-600">
          The link may be old, or this mock test may no longer be published.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/mock-tests" className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Browse mock tests</Link>
          <Link href="/" className="rounded-xl border bg-white px-5 py-3 font-bold text-slate-800">Return home</Link>
        </div>
      </section>
    </main>
  );
}
