import Link from "next/link";

type PublicHeaderProps = {
  compact?: boolean;
};

export function PublicHeader({ compact = false }: PublicHeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
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
              TGPSC practice
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 sm:flex">
          <Link href="/exams" className="transition hover:text-slate-950">
            Exams
          </Link>
          <Link href="/mock-tests" className="transition hover:text-slate-950">
            Mock tests
          </Link>
        </nav>

        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  );
}
