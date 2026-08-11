import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";
import { BrandLockup } from "@/components/brand/VaradhiBrand";
import { createClient } from "@/lib/supabase/server";

type PublicHeaderProps = {
  compact?: boolean;
};

export async function PublicHeader({ compact = false }: PublicHeaderProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div
        className={`mx-auto flex items-center justify-between gap-4 px-4 sm:px-8 ${
          compact ? "max-w-4xl py-3" : "max-w-6xl py-3.5"
        }`}
      >
        <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="Varadhi home">
          <BrandLockup />
        </Link>

        <nav aria-label="Primary navigation" className="font-brand hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-1 text-[15px] font-bold tracking-[-0.01em] text-slate-600 shadow-inner shadow-slate-950/[0.02] md:flex">
          <Link href="/mock-tests" className="rounded-xl px-4 py-2.5 transition hover:bg-white hover:text-slate-950 hover:shadow-sm">
            Mock tests
          </Link>
          {!compact && <Link href="/#how-it-works" className="rounded-xl px-4 py-2.5 transition hover:bg-white hover:text-slate-950 hover:shadow-sm">How it works</Link>}
          {user && <Link href="/dashboard" className="rounded-xl px-4 py-2.5 transition hover:bg-white hover:text-slate-950 hover:shadow-sm">My progress</Link>}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-950 px-3.5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 md:hidden"
              >
                Dashboard
              </Link>
              <span className="hidden max-w-48 truncate text-xs font-semibold text-slate-500 lg:block">
                {user.email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 sm:inline-flex"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="group/button inline-flex items-center gap-2 rounded-xl bg-slate-950 py-2 pl-4 pr-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
              >
                Start free
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-300 text-slate-950 transition group-hover/button:translate-x-0.5" aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
