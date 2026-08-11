type BrandMarkProps = { className?: string };

export function BrandMark({ className = "h-11 w-11" }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="15" fill="#071225" />
      <path d="M11.5 12.5 24 35.8l12.5-23.3" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 25.2c8.2-6.5 20.8-6.5 29 0" stroke="#5EEAD4" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="9.5" cy="25.2" r="2" fill="#5EEAD4" />
      <circle cx="38.5" cy="25.2" r="2" fill="#5EEAD4" />
    </svg>
  );
}

type BrandLockupProps = { context?: "public" | "admin"; markClassName?: string };

export function BrandLockup({ context = "public", markClassName }: BrandLockupProps) {
  const admin = context === "admin";
  return (
    <span className="flex items-center gap-3">
      <BrandMark className={markClassName ?? "h-11 w-11 shrink-0 drop-shadow-[0_8px_12px_rgba(7,18,37,0.18)]"} />
      <span className="leading-none">
        <span className={`font-brand block text-[1.28rem] font-bold tracking-[-0.035em] ${admin ? "text-white" : "text-slate-950"}`}>Varadhi Prep</span>
        <span className={`mt-1.5 block text-[8px] font-black uppercase tracking-[0.18em] ${admin ? "text-teal-200" : "text-teal-700"}`}>{admin ? "Admin workspace" : "Smart mock tests for career growth"}</span>
      </span>
    </span>
  );
}
