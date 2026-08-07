import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-white p-6">
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
              Groups
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
              href="/admin/users"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Users
            </Link>

            <Link
              href="/admin/results"
              className="block rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Results
            </Link>
          </nav>
        </aside>

        <div className="flex-1">
          <header className="flex h-16 items-center justify-between border-b bg-white px-8">
            <div>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>

            <div className="text-sm font-medium">
              Administrator
            </div>
          </header>

          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}