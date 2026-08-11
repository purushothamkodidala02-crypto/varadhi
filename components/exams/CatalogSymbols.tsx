import { inferExamKind } from "@/lib/exam-catalog";

type SymbolProps = { className?: string };

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function StateSymbol({ slug, className = "h-6 w-6" }: SymbolProps & { slug: string }) {
  if (slug === "central") {
    return (
      <svg {...svgProps} className={className}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3.5 12h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12S9.8 18.6 12 21" />
      </svg>
    );
  }

  return (
    <svg {...svgProps} className={className}>
      <path d="M12 21s6.5-5.7 6.5-11.5a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </svg>
  );
}

export function ExamSymbol({ name, className = "h-6 w-6" }: SymbolProps & { name: string }) {
  const kind = inferExamKind(name);

  if (kind === "police") {
    return (
      <svg {...svgProps} className={className}>
        <path d="M12 3 5.5 5.8v5.6c0 4.1 2.6 7.7 6.5 9.6 3.9-1.9 6.5-5.5 6.5-9.6V5.8L12 3Z" />
        <path d="m12 7 1.2 2.4 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4L12 7Z" />
      </svg>
    );
  }

  if (kind === "education") {
    return (
      <svg {...svgProps} className={className}>
        <path d="m3 8.5 9-4 9 4-9 4-9-4Z" />
        <path d="M6.5 10.2v5.1c3.3 2.3 7.7 2.3 11 0v-5.1M21 8.5V14" />
      </svg>
    );
  }

  if (kind === "engineering") {
    return (
      <svg {...svgProps} className={className}>
        <path d="M4 20h16M6 20V9l6-5 6 5v11" />
        <path d="M9 20v-6h6v6M9 10h.01M15 10h.01" />
      </svg>
    );
  }

  if (kind === "administration") {
    return (
      <svg {...svgProps} className={className}>
        <path d="m3 9 9-5 9 5M5 10h14M6.5 10v7M10.2 10v7M13.8 10v7M17.5 10v7M4 20h16M5 17h14" />
      </svg>
    );
  }

  return (
    <svg {...svgProps} className={className}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

export function PaperSymbol({ className = "h-6 w-6" }: SymbolProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M7 3.5h7l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V7h3M9 11h6M9 14.5h6M9 18h3" />
    </svg>
  );
}

export function MockSymbol({ className = "h-6 w-6" }: SymbolProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2M8 3.9 6.5 2.5M16 3.9l1.5-1.4" />
    </svg>
  );
}
