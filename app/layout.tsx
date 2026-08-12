import type { Metadata } from "next";
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

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: "/varadhi-mark.svg",
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
    url: "/",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}