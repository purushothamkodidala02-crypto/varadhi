"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

export function QuestionMedia({
  src,
  alt = "Reference image for this question",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function showLargeImage() {
    setZoom(1);
    setOpen(true);
  }

  return (
    <>
      <figure className={`rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:p-3 ${className}`}>
        <button
          type="button"
          onClick={showLargeImage}
          aria-label="Open a larger view of the Question image"
          className="group block w-full overflow-hidden rounded-xl bg-white outline-none ring-teal-500 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="mx-auto max-h-[42rem] min-h-40 w-full object-contain transition group-hover:scale-[1.01] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:min-h-56"
          />
        </button>
        <figcaption className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
          <span aria-hidden="true">⌕</span>
          Select the image to enlarge it
        </figcaption>
      </figure>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged Question image"
          className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 text-white"
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/15 px-3 py-3 sm:px-5">
            <p className="text-sm font-bold">Question image</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.5))} disabled={zoom <= 1} aria-label="Zoom out" className="grid h-10 min-w-10 place-items-center rounded-lg border border-white/30 px-3 text-lg font-black disabled:opacity-35">−</button>
              <span className="min-w-14 text-center text-xs font-bold" aria-live="polite">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.5))} disabled={zoom >= 3} aria-label="Zoom in" className="grid h-10 min-w-10 place-items-center rounded-lg border border-white/30 px-3 text-lg font-black disabled:opacity-35">+</button>
              <button type="button" autoFocus onClick={() => setOpen(false)} className="ml-1 rounded-lg bg-white px-4 py-2.5 text-sm font-black text-slate-950">Close</button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
            <div className="mx-auto flex min-h-full w-full items-center justify-center" style={{ minWidth: `${zoom * 100}%` }}>
              <img
                src={src}
                alt={alt}
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-auto max-h-none w-full object-contain"
                style={{ maxWidth: `${90 * zoom}rem` }}
              />
            </div>
          </div>
          <p className="shrink-0 border-t border-white/15 px-4 py-2 text-center text-xs text-slate-300">Use + and − to zoom. Scroll to inspect the complete image.</p>
        </div>
      )}
    </>
  );
}
