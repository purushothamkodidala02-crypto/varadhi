function SkeletonBlock({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none ${className}`} />;
}

export function PublicRouteLoading({ label = "Loading Varadhi Prep" }: { label?: string }) {
  return (
    <main aria-busy="true" aria-label={label} className="min-h-screen bg-white">
      <span className="sr-only" role="status" aria-live="polite">{label}</span>
      <div className="border-b px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-6xl items-center justify-between"><SkeletonBlock className="h-11 w-52" /><SkeletonBlock className="h-11 w-28" /></div></div>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="mt-5 h-12 w-full max-w-2xl" />
        <SkeletonBlock className="mt-4 h-5 w-full max-w-xl" />
        <div className="mt-9 grid gap-5 md:grid-cols-3">{[0, 1, 2].map((item) => <SkeletonBlock key={item} className="h-52 w-full rounded-3xl" />)}</div>
      </div>
    </main>
  );
}

export function DashboardRouteLoading({ label = "Loading your dashboard" }: { label?: string }) {
  return (
    <main aria-busy="true" aria-label={label} className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8">
      <span className="sr-only" role="status" aria-live="polite">{label}</span>
      <div className="mx-auto max-w-6xl">
        <SkeletonBlock className="h-9 w-64" />
        <div className="mt-7 grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <SkeletonBlock key={item} className="h-28 w-full rounded-2xl" />)}</div>
        <SkeletonBlock className="mt-7 h-72 w-full rounded-3xl" />
      </div>
    </main>
  );
}

export function AdminRouteLoading({ label = "Loading admin workspace" }: { label?: string }) {
  return (
    <main aria-busy="true" aria-label={label} className="px-5 py-7 sm:px-8">
      <span className="sr-only" role="status" aria-live="polite">{label}</span>
      <div className="mx-auto max-w-7xl">
        <SkeletonBlock className="h-10 w-72" />
        <SkeletonBlock className="mt-3 h-5 w-full max-w-xl" />
        <div className="mt-8 grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-24 w-full rounded-2xl" />)}</div>
        <SkeletonBlock className="mt-7 h-80 w-full rounded-3xl" />
      </div>
    </main>
  );
}

export function AuthRouteLoading({ label = "Loading secure account page" }: { label?: string }) {
  return (
    <main aria-busy="true" aria-label={label} className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10">
      <span className="sr-only" role="status" aria-live="polite">{label}</span>
      <div className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm">
        <SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="mt-4 h-10 w-72 max-w-full" />
        <SkeletonBlock className="mt-7 h-12 w-full" /><SkeletonBlock className="mt-4 h-12 w-full" /><SkeletonBlock className="mt-6 h-12 w-full" />
      </div>
    </main>
  );
}

