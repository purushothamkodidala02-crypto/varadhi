import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-2xl font-bold">Varadhi</Link>
        <nav className="flex items-center gap-4 text-sm font-medium"><Link href="/exams" className="hover:underline">Exams</Link><Link href="/mock-tests" className="hover:underline">Mock Tests</Link><Link href="/login" className="rounded-lg border px-4 py-2">Login</Link></nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">TGPSC preparation</p><h1 className="mt-5 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">Practice with purpose. Perform with confidence.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">Varadhi gives TGPSC aspirants focused mock tests, secure results, and clear performance insights in one simple place.</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/mock-tests" className="rounded-lg bg-black px-5 py-3 font-medium text-white">Browse Mock Tests</Link><Link href="/register" className="rounded-lg border bg-white px-5 py-3 font-medium">Create account</Link></div></div>
        <aside className="rounded-2xl border bg-white p-7 shadow-sm"><p className="text-sm font-semibold text-gray-500">Built for focused practice</p><div className="mt-6 space-y-5"><div><p className="font-semibold">TGPSC-aligned questions</p><p className="mt-1 text-sm text-gray-600">Organized by exam entry and subject.</p></div><div><p className="font-semibold">Timed mock tests</p><p className="mt-1 text-sm text-gray-600">Practice in a real test-style flow.</p></div><div><p className="font-semibold">Private performance insights</p><p className="mt-1 text-sm text-gray-600">Review results and track subject accuracy.</p></div></div></aside>
      </section>
    </main>
  );
}
