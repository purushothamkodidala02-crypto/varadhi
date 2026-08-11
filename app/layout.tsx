import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Varadhi: Free TGPSC Mock Tests",
    template: "%s | Varadhi",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: { icon: "/varadhi-mark.svg" },
  category: "education",
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["te_IN"],
    siteName: SITE_NAME,
    title: "Varadhi: Free TGPSC Mock Tests",
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Varadhi: Free TGPSC Mock Tests",
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
