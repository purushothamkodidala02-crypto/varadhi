import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Test Attempt",
  robots: { index: false, follow: false },
};

export default function MockTestAttemptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
