"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primaryLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/exams", label: "Exams" },
  { href: "/admin/groups", label: "Exam entries" },
];

const moreLinks = [
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/mock-tests", label: "Mock tests" },
  { href: "/admin/questions", label: "Question bank" },
  { href: "/admin/results", label: "Results" },
];

function isCurrentPath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function NavLink({ href, label, compact = false }: { href: string; label: string; compact?: boolean }) {
  const pathname = usePathname();
  const active = isCurrentPath(pathname, href);
  return <Link href={href} className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"} ${compact ? "whitespace-nowrap" : ""}`}>{label}</Link>;
}

function MoreButton({ open, onClick, compact = false, active = false }: { open: boolean; onClick: () => void; compact?: boolean; active?: boolean }) {
  return <button type="button" onClick={onClick} aria-expanded={open} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"} ${compact ? "whitespace-nowrap" : ""}`}><span className="grid gap-1" aria-hidden="true"><span className="h-0.5 w-4 rounded bg-current" /><span className="h-0.5 w-4 rounded bg-current" /><span className="h-0.5 w-4 rounded bg-current" /></span>{open ? "Close tools" : "More tools"}</button>;
}

export function AdminNavigation() {
  const pathname = usePathname();
  const moreIsActive = moreLinks.some((link) => isCurrentPath(pathname, link.href));
  const [moreOpen, setMoreOpen] = useState(moreIsActive);

  return (
    <>
      <aside className="hidden min-h-screen border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <Link href="/admin" className="flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">V</span><span><span className="block text-lg font-black tracking-tight text-slate-950">Varadhi</span><span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">Admin workspace</span></span></Link>
        <nav className="mt-8 space-y-1"><p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Main menu</p><div className="mt-2 space-y-1">{primaryLinks.map((link) => <NavLink key={link.href} {...link} />)}</div><div className="mt-3 border-t border-slate-100 pt-3"><MoreButton open={moreOpen} onClick={() => setMoreOpen((open) => !open)} active={moreIsActive} />{moreOpen && <div className="mt-2 space-y-1 border-l border-slate-200 pl-3">{moreLinks.map((link) => <NavLink key={link.href} {...link} />)}</div>}</div></nav>
        <Link href="/" className="mt-10 inline-flex px-3 text-sm font-semibold text-slate-500 hover:text-slate-950">← View student site</Link>
      </aside>

      <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden"><div className="overflow-x-auto pb-1"><nav className="flex min-w-max gap-2">{primaryLinks.map((link) => <NavLink key={link.href} {...link} compact />)}<MoreButton open={moreOpen} onClick={() => setMoreOpen((open) => !open)} compact active={moreIsActive} />{moreOpen && moreLinks.map((link) => <NavLink key={link.href} {...link} compact />)}</nav></div></div>
    </>
  );
}
