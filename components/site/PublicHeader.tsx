import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";
import { BrandLockup } from "@/components/brand/VaradhiBrand";
import { PublicNavigationMenu } from "@/components/site/PublicNavigationMenu";
import { createClient } from "@/lib/supabase/server";

type PublicHeaderProps = {
  compact?: boolean;
};

export async function PublicHeader({ compact = false }: PublicHeaderProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const navigation = [
    { href: "/", label: "Home", icon: "home" as const },
    { href: "/mock-tests", label: "Mock tests", icon: "tests" as const },
    { href: "/support", label: "Support", icon: "support" as const },
    ...(user ? [{ href: "/dashboard", label: "My progress", icon: "progress" as const }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div
          className={`mx-auto flex items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8 ${
          compact ? "max-w-4xl py-3" : "max-w-6xl py-3.5"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <PublicNavigationMenu items={navigation} />
          <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Varadhi Prep home">
            <BrandLockup />
          </Link>
        </div>

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
    </header>
  );
}
