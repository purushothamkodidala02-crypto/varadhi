"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <main className="max-w-xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-teal-300">Varadhi Prep</p>
          <h1 className="mt-4 text-3xl font-black">The site could not finish loading.</h1>
          <p className="mt-4 leading-7 text-slate-300">Please try once more. If the problem continues, return after a few minutes.</p>
          <button type="button" onClick={reset} className="mt-7 rounded-xl bg-teal-300 px-5 py-3 font-bold text-slate-950">Try again</button>
        </main>
      </body>
    </html>
  );
}
