"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/client";

export function PublicAccountActions() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {email ? (
        <>
          <span className="hidden max-w-48 truncate text-xs font-semibold text-slate-500 lg:block">
            {email}
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
  );
}
