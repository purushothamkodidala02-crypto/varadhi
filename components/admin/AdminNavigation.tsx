"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const contentLinks = [
  { href: "/admin/exams", label: "Exams" },
  { href: "/admin/groups", label: "Exam entries" },
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/mock-tests", label: "Mock tests" },
  { href: "/admin/questions", label: "Question bank" },
];

const managementLinks = [{ href: "/admin/results", label: "Results" }];

function isCurrentPath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function NavigationLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const linkClass = (href: string) =>
    `block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isCurrentPath(pathname, href)
        ? "bg-teal-50 text-teal-800"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  if (compact) {
    return (
      <div className="flex min-w-max gap-2">
        <Link href="/admin" className={linkClass("/admin")}>Overview</Link>
        {contentLinks.map((link) => <Link key={link.href} href={link.href} className={linkClass(link.href)}>{link.label}</Link>)}
        {managementLinks.map((link) => <Link key={link.href} href={link.href} className={linkClass(link.href)}>{link.label}</Link>)}
      </div>
    );
  }

  return (
    <nav className="mt-8 space-y-1">
      <Link href="/admin" className={linkClass("/admin")}>Overview</Link>
      <p className="mt-7 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Build your library</p>
      <div className="mt-2 space-y-1">
        {contentLinks.map((link) => <Link key={link.href} href={link.href} className={linkClass(link.href)}>{link.label}</Link>)}
      </div>
      <p className="mt-7 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Monitor</p>
      <div className="mt-2 space-y-1">
        {managementLinks.map((link) => <Link key={link.href} href={link.href} className={linkClass(link.href)}>{link.label}</Link>)}
      </div>
    </nav>
  );
}

export function AdminNavigation() {
  return (
    <>
      <aside className="hidden min-h-screen border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">V</span>
          <span>
            <span className="block text-lg font-black tracking-tight text-slate-950">Varadhi</span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">Admin workspace</span>
          </span>
        </Link>
        <NavigationLinks />
        <Link href="/" className="mt-10 inline-flex px-3 text-sm font-semibold text-slate-500 hover:text-slate-950">
          ← View student site
        </Link>
      </aside>

      <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="overflow-x-auto pb-1">
          <NavigationLinks compact />
        </div>
      </div>
    </>
  );
}
