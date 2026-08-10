import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create a Free Account",
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader compact />
      <div className="mx-auto grid max-w-4xl gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.85fr_1.15fr] md:items-start">
        <aside className="rounded-3xl bg-teal-700 p-7 text-white md:sticky md:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-100">
            Start free
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Make every practice session count.
          </h1>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-teal-50">
            <li>• Explore Group and job-wise mock tests</li>
            <li>• Take timed tests with saved progress</li>
            <li>• Review attempts and subject accuracy</li>
          </ul>
        </aside>
        <RegisterForm />
      </div>
    </main>
  );
}
