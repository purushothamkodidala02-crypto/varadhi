import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Varadhi - TGPSC Mock Tests",
  description: "Online mock tests for TGPSC and competitive examinations.",
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
