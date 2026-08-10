import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/server";

type PublicHeaderProps = {
  compact?: boolean;
};

export async function PublicHeader({ compact = false }: PublicHeaderProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="relative z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div
        className={`mx-auto flex items-center justify-between gap-4 px-5 sm:px-8 ${
          compact ? "max-w-4xl py-4" : "max-w-6xl py-5"
        }`}
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-950/15">
            V
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight text-slate-950">
              Varadhi
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 sm:block">
              Exam practice
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 sm:flex">
          <Link href="/mock-tests" className="transition hover:text-slate-950">
            Mock tests
          </Link>
          {!compact && <Link href="/#how-it-works" className="transition hover:text-slate-950">How it works</Link>}
          {user && <Link href="/dashboard" className="transition hover:text-slate-950">My progress</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:hidden"
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
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
