"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [navigation, setNavigation] = useState<{ sourceHref: string; id: number } | null>(null);
  const navigationId = useRef(0);
  const pending = navigation !== null;

  useEffect(() => {
    function startForLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement) || target.target === "_blank" || target.hasAttribute("download")) return;
      const next = new URL(target.href, window.location.href);
      if (next.origin !== window.location.origin || next.href === window.location.href || next.hash && next.pathname === window.location.pathname && next.search === window.location.search) return;
      if (next.pathname.endsWith("/questions-export")) return;
      navigationId.current += 1;
      setNavigation({ sourceHref: window.location.href, id: navigationId.current });
    }

    function startForGetForm(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const declaredMethod = form.getAttribute("method")?.toLowerCase();
      if (declaredMethod !== "get") return;
      const next = new URL(form.action || window.location.href, window.location.href);
      const values = new URLSearchParams();
      for (const [name, value] of new FormData(form)) {
        if (typeof value === "string") values.append(name, value);
      }
      if (event.submitter instanceof HTMLButtonElement && event.submitter.name) {
        values.append(event.submitter.name, event.submitter.value);
      }
      next.search = values.toString();
      if (next.href === window.location.href) return;
      navigationId.current += 1;
      setNavigation({ sourceHref: window.location.href, id: navigationId.current });
    }

    document.addEventListener("click", startForLink, true);
    document.addEventListener("submit", startForGetForm, true);
    return () => {
      document.removeEventListener("click", startForLink, true);
      document.removeEventListener("submit", startForGetForm, true);
    };
  }, [pathname]);

  useEffect(() => {
    if (!pending) return;
    const activeNavigation = navigation;
    const clearIfUrlChanged = () => {
      if (window.location.href === activeNavigation.sourceHref) return;
      setNavigation((current) => current?.id === activeNavigation.id ? null : current);
    };
    clearIfUrlChanged();
    const urlTimer = window.setInterval(clearIfUrlChanged, 100);
    const safetyTimer = window.setTimeout(() => {
      setNavigation((current) => current?.id === activeNavigation.id ? null : current);
    }, 30000);
    return () => {
      window.clearInterval(urlTimer);
      window.clearTimeout(safetyTimer);
    };
  }, [navigation, pathname, pending]);

  return (
    <div className={`pointer-events-none fixed inset-x-0 top-0 z-[200] transition-opacity ${pending ? "opacity-100" : "opacity-0"}`} aria-hidden={!pending}>
      <div className="h-1 overflow-hidden bg-teal-100/80">
        <span className="block h-full w-1/3 animate-[navigation-progress_1.1s_ease-in-out_infinite] bg-teal-500 motion-reduce:w-full motion-reduce:animate-none" />
      </div>
      {pending && <SlowNavigationMessage />}
      <span className="sr-only" role="status" aria-live="polite">{pending ? "Loading the next page" : ""}</span>
    </div>
  );
}

function SlowNavigationMessage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(true), 8000);
    return () => window.clearTimeout(timeout);
  }, []);
  if (!visible) return null;
  return <p role="status" aria-live="polite" className="mx-auto mt-2 w-fit max-w-[calc(100vw-2rem)] rounded-full bg-slate-950 px-4 py-2 text-center text-xs font-bold text-white shadow-lg">This is taking longer than expected. Please wait or try again.</p>;
}
