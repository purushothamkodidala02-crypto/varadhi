import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex min-h-screen">
        <aside className="w-64 shrink-0 border-r bg-white p-6">
          <Link href="/admin" className="text-xl font-bold">
            Varadhi Admin
          </Link>

          <nav className="mt-8 space-y-2 text-sm">
            <Link
              href="/admin"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <p className="mt-6 px-3 text-xs font-semibold uppercase text-gray-400">
              Content
            </p>

            <Link
              href="/admin/exams"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Exams
            </Link>

            <Link
              href="/admin/groups"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Exam Entries
            </Link>

            <Link
              href="/admin/subjects"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Subjects
            </Link>

            <Link
              href="/admin/mock-tests"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Mock Tests
            </Link>

            <Link
              href="/admin/questions"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Questions
            </Link>

            <p className="mt-6 px-3 text-xs font-semibold uppercase text-gray-400">
              Management
            </p>

            <Link
              href="/admin/results"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Results
            </Link>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b bg-white px-8">
            <p className="text-sm text-gray-500">
              Admin Panel
            </p>

            <div className="flex items-center gap-4">
              <p className="text-sm font-medium">
                {user.email}
              </p>

              <LogoutButton />
            </div>
          </header>

          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
