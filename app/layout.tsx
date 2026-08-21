import type { Metadata } from "next";
import { connection } from "next/server";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Varadhi Prep: Smart Mock Tests for Career Growth",
    template: "%s | Varadhi Prep",
  },

  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,

  icons: {
    icon: [
      { url: "/varadhi-icon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/varadhi-logo-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/varadhi-icon-96.png",
    apple: [{ url: "/varadhi-icon-192.png", type: "image/png", sizes: "192x192" }],
  },

  manifest: "/manifest.webmanifest",

  category: "education",

  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["te_IN"],
    siteName: SITE_NAME,
    title: "Varadhi Prep: Smart Mock Tests for Career Growth",
    description: SITE_DESCRIPTION,
  },

  twitter: {
    card: "summary_large_image",
    title: "Varadhi Prep: Smart Mock Tests for Career Growth",
    description: SITE_DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A nonce-based CSP requires request-time rendering so Next.js can attach
  // the request nonce to its framework and hydration scripts.
  await connection();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
