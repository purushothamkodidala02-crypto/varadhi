import Link from "next/link";
import { BrandLockup } from "@/components/brand/VaradhiBrand";
import { PublicAccountActions } from "@/components/site/PublicAccountActions";
import { PublicNavigationMenu } from "@/components/site/PublicNavigationMenu";

type PublicHeaderProps = {
  compact?: boolean;
};

export function PublicHeader({ compact = false }: PublicHeaderProps) {
  const navigation = [
    { href: "/", label: "Home", icon: "home" as const },
    { href: "/mock-tests", label: "Mock tests", icon: "tests" as const },
    { href: "/support", label: "Support", icon: "support" as const },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div
          className={`mx-auto flex items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8 ${
          compact ? "max-w-4xl py-3" : "max-w-6xl py-3.5"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <PublicNavigationMenu items={navigation} />
          <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Varadhi Prep home">
            <BrandLockup />
          </Link>
        </div>

        <PublicAccountActions />
      </div>
    </header>
  );
}
