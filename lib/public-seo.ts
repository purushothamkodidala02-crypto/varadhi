import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export function publicCollectionMetadata({
  title,
  description,
  canonical,
  indexable = true,
}: {
  title: string;
  description: string;
  canonical: string;
  indexable?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: indexable, follow: true },
    openGraph: { type: "website", url: canonical, title, description, siteName: "Varadhi Prep", images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}

export function isIndexableCollectionQuery(filters: { q?: string; type?: string; page?: string }) {
  return !filters.q && !filters.type && (!filters.page || filters.page === "1");
}

export function collectionStructuredData(
  name: string,
  description: string,
  canonical: string,
  crumbs: Array<{ name: string; path: string }>,
) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name,
      description,
      url: absoluteUrl(canonical),
      educationalUse: "Practice",
      isPartOf: { "@type": "WebSite", name: "Varadhi Prep", url: absoluteUrl("/") },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      })),
    },
  ];
}
