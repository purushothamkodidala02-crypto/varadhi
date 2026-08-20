"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type NavigationIconName = "home" | "tests" | "support" | "progress";

type NavigationItem = {
  href: string;
  label: string;
  icon: NavigationIconName;
};

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function PublicNavigationMenu({ items }: { items: NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
  const [hasUser, setHasUser] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const visibleItems = hasUser
    ? [...items, { href: "/dashboard", label: "My progress", icon: "progress" as const }]
    : items;

  const closeMenu = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setHasUser(Boolean(data.user));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setHasUser(Boolean(session?.user));
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeMenu, open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Open navigation menu"
        className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
      >
        <span className="space-y-1.5" aria-hidden="true">
          <span className="block h-0.5 w-5 rounded-full bg-current" />
          <span className="block h-0.5 w-5 rounded-full bg-current" />
          <span className="block h-0.5 w-5 rounded-full bg-current" />
        </span>
      </button>

      {mounted && createPortal(<div className={`fixed inset-0 z-[100] ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
          className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          tabIndex={open ? 0 : -1}
        />
        <aside
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          inert={!open}
          className={`absolute left-0 top-0 flex h-dvh w-[min(21rem,88vw)] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="font-display text-lg text-slate-950">Varadhi Prep</p>
              <p className="text-xs font-semibold text-slate-500">Navigation</p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeMenu}
              aria-label="Close navigation menu"
              className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-xl font-semibold text-slate-700 hover:bg-slate-200"
            >
              ×
            </button>
          </div>

          <nav className="font-brand flex-1 space-y-2 overflow-y-auto p-4" aria-label="Sidebar navigation">
            {visibleItems.map((item) => {
              const tone = navigationToneStyles[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-black transition hover:translate-x-0.5 ${tone.link}`}
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone.icon}`}>
                    <NavigationIcon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                  <span className="ml-auto text-lg opacity-50 transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-5 text-xs leading-5 text-slate-500">
            Need help? Email <a href="mailto:support@varadhiprep.in" className="font-bold text-teal-700">support@varadhiprep.in</a>
          </div>
        </aside>
      </div>, document.body)}
    </>
  );
}

const navigationToneStyles = {
  home: {
    link: "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
    icon: "bg-slate-900 text-white",
  },
  tests: {
    link: "border-teal-100 bg-teal-50 text-teal-900 hover:border-teal-200 hover:bg-teal-100",
    icon: "bg-teal-200/70 text-teal-800",
  },
  progress: {
    link: "border-slate-900 bg-slate-950 text-white hover:border-teal-400 hover:bg-slate-800",
    icon: "bg-teal-300 text-slate-950",
  },
  support: {
    link: "border-cyan-100 bg-cyan-50 text-cyan-900 hover:border-cyan-200 hover:bg-cyan-100",
    icon: "bg-cyan-200/70 text-cyan-900",
  },
} as const;

function NavigationIcon({ name }: { name: NavigationIconName }) {
  if (name === "home") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path d="m4 10 8-6 8 6v9.5h-6v-6h-4v6H4z" strokeLinejoin="round" /></svg>;
  if (name === "tests") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path d="M7 3.5h8l3 3V20H7z" strokeLinejoin="round" /><path d="M15 3.5V7h3M9.5 11h6M9.5 14.5h6" strokeLinecap="round" /></svg>;
  if (name === "support") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m5 7 7 5.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path d="M5 19V9m7 10V5m7 14v-7" strokeLinecap="round" /><path d="M3.5 19.5h17" strokeLinecap="round" /></svg>;
}
