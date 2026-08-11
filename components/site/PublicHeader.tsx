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
  const navigation = [
    { href: "/mock-tests", label: "Mock tests", icon: "tests" as const },
    ...(!compact ? [{ href: "/#how-it-works", label: "How it works", icon: "guide" as const }] : []),
    ...(user ? [{ href: "/dashboard", label: "My progress", icon: "progress" as const }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div
          className={`mx-auto flex items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8 ${
          compact ? "max-w-4xl py-3" : "max-w-6xl py-3.5"
        }`}
      >
        <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="Varadhi Prep home">
          <BrandLockup />
        </Link>

        <nav aria-label="Primary navigation" className="font-brand hidden items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 text-[15px] font-bold tracking-[-0.01em] shadow-sm md:flex">
          {navigation.map((item) => {
            const tone = navigationToneStyles[item.icon];
            return <Link key={item.href} href={item.href} className={`group/nav inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 transition hover:-translate-y-0.5 hover:shadow-sm ${tone.desktop}`}><span className={`grid h-7 w-7 place-items-center rounded-lg transition group-hover/nav:scale-105 ${tone.icon}`}><NavigationIcon name={item.icon} /></span>{item.label}</Link>;
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
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
                className="group/button inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl sm:py-2 sm:pl-4 sm:pr-2 sm:text-sm"
              >
                Start free
                <span className="hidden h-7 w-7 place-items-center rounded-lg bg-teal-300 text-slate-950 transition group-hover/button:translate-x-0.5 sm:grid" aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>
      </div>
      <nav aria-label="Mobile navigation" className="border-t border-slate-200/70 bg-white/95 px-3 py-2 md:hidden">
        <div className="mx-auto grid max-w-xl gap-1" style={{ gridTemplateColumns: `repeat(${navigation.length}, minmax(0, 1fr))` }}>
          {navigation.map((item) => {
            const tone = navigationToneStyles[item.icon];
            return <Link key={item.href} href={item.href} className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-transparent px-1 py-2 text-center text-[11px] font-bold transition ${tone.mobile}`}><span className={`grid h-7 w-7 place-items-center rounded-lg ${tone.icon}`}><NavigationIcon name={item.icon} /></span><span className="truncate">{item.label}</span></Link>;
          })}
        </div>
      </nav>
    </header>
  );
}

const navigationToneStyles = {
  tests: {
    desktop: "bg-teal-50/80 text-teal-900 hover:border-teal-200 hover:bg-teal-100",
    mobile: "bg-teal-50/70 text-teal-900 hover:border-teal-200 hover:bg-teal-100",
    icon: "bg-teal-200/70 text-teal-800",
  },
  guide: {
    desktop: "bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100",
    mobile: "bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100",
    icon: "bg-slate-200 text-slate-800",
  },
  progress: {
    desktop: "bg-slate-950 text-white hover:border-teal-300 hover:bg-slate-800",
    mobile: "bg-slate-950 text-white hover:border-teal-300 hover:bg-slate-800",
    icon: "bg-teal-300 text-slate-950",
  },
} as const;

function NavigationIcon({ name }: { name: "tests" | "guide" | "progress" }) {
  if (name === "tests") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[1.15rem] w-[1.15rem] fill-none stroke-current stroke-[1.8]"><path d="M7 3.5h8l3 3V20H7z" strokeLinejoin="round" /><path d="M15 3.5V7h3M9.5 11h6M9.5 14.5h6" strokeLinecap="round" /></svg>;
  if (name === "guide") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[1.15rem] w-[1.15rem] fill-none stroke-current stroke-[1.8]"><circle cx="12" cy="12" r="8.5" /><path d="M12 10.5V16M12 7.8v.2" strokeLinecap="round" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[1.15rem] w-[1.15rem] fill-none stroke-current stroke-[1.8]"><path d="M5 19V9m7 10V5m7 14v-7" strokeLinecap="round" /><path d="M3.5 19.5h17" strokeLinecap="round" /></svg>;
}
