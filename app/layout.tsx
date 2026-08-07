import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-bold">
              Varadhi
            </Link>

            <div className="flex items-center gap-6 text-sm">
              <Link href="/" className="hover:text-blue-600">
                Home
              </Link>

              <Link href="/mock-tests" className="hover:text-blue-600">
                Mock Tests
              </Link>

              <Link href="/exams" className="hover:text-blue-600">
                Exams
              </Link>

              <Link href="/login" className="hover:text-blue-600">
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
              >
                Register
              </Link>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="mt-16 border-t">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-gray-500">
            © 2026 Varadhi. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}