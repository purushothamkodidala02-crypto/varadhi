import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicHeader } from "@/components/site/PublicHeader";
import { absoluteUrl } from "@/lib/site";

const supportEmail = "support@varadhiprep.in";
const supportDescription = "Contact Varadhi Prep support for help with your account, mock tests, attempts, payments or results.";

export const metadata: Metadata = {
  title: "Contact Support",
  description: supportDescription,
  alternates: { canonical: "/support" },
  openGraph: {
    type: "website",
    url: "/support",
    title: "Contact Varadhi Prep Support",
    description: supportDescription,
    siteName: "Varadhi Prep",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Varadhi Prep support" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Varadhi Prep Support",
    description: supportDescription,
    images: ["/opengraph-image"],
  },
};

export default function SupportPage() {
  const subject = encodeURIComponent("Varadhi Prep support request");
  const mailtoUrl = `mailto:${supportEmail}?subject=${subject}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${subject}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Varadhi Prep Support",
      description: supportDescription,
      url: absoluteUrl("/support"),
      mainEntity: {
        "@type": "Organization",
        name: "Varadhi Prep",
        url: absoluteUrl("/"),
        email: supportEmail,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: supportEmail,
          availableLanguage: ["English", "Telugu"],
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Support", item: absoluteUrl("/support") },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <JsonLd data={jsonLd} />
      <PublicHeader compact />
      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-xl shadow-slate-950/5">
          <div className="bg-gradient-to-br from-cyan-50 via-teal-50 to-white px-6 py-9 sm:px-10">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Varadhi Prep support</p>
            <h1 className="font-display mt-3 text-3xl tracking-tight sm:text-4xl">How can we help?</h1>
            <p className="mt-4 max-w-xl leading-7 text-slate-600">
              Contact us for help with your account, mock tests, attempts, payments or results.
            </p>
          </div>

          <div className="px-6 py-8 sm:px-10">
            <p className="text-sm font-bold text-slate-500">Official support email</p>
            <a href={mailtoUrl} className="mt-2 block break-all text-xl font-black text-teal-700 hover:text-teal-900">
              {supportEmail}
            </a>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={mailtoUrl} className="inline-flex justify-center rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white hover:bg-slate-800">
                Open email app
              </a>
              <a href={gmailUrl} target="_blank" rel="noreferrer" className="inline-flex justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-3.5 text-sm font-black text-cyan-900 hover:bg-cyan-100">
                Open Gmail
              </a>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              If no email app is configured on your device, use Open Gmail or copy the address shown above.
            </p>
            <Link href="/" className="mt-8 inline-flex text-sm font-black text-teal-700 hover:text-teal-900">
              ← Back to Varadhi Prep
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
