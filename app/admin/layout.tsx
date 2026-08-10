import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import LogoutButton from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#f3f7f8] text-slate-900">
      <AdminNavigation />
      <div className="min-w-0 md:pl-64">
        <header className="sticky top-0 z-20 flex min-h-18 items-center justify-between gap-4 border-b border-teal-100 bg-white/90 px-5 py-4 shadow-sm shadow-slate-950/[0.03] backdrop-blur sm:px-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-teal-800"><span className="h-2 w-2 rounded-full bg-teal-500" />Administration</p>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">Manage exam content, tests, and student outcomes.</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden max-w-56 truncate text-sm font-semibold text-slate-700 sm:block">{user.email}</p>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
