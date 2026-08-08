import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import LogoutButton from "@/components/admin/LogoutButton";
import { createClient } from "@/lib/supabase/server";

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
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Suspense fallback={<aside className="min-h-screen w-64 shrink-0 border-r bg-white" />}>
        <AdminNavigation />
      </Suspense>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-18 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Control centre</p>
            <p className="mt-1 text-sm text-slate-500">Create, organise and publish learning content.</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden max-w-56 truncate text-sm font-semibold text-slate-700 sm:block">{user.email}</p>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
