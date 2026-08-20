import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { absoluteUrl } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";

const getPublishedTests = unstable_cache(async () => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("mock_tests")
    .select("id, updated_at")
    .eq("status", "published")
    .eq("access_type", "free")
    .order("display_order");
  return data ?? [];
}, ["published-test-sitemap-v1"], { tags: [PUBLIC_CATALOG_TAG], revalidate: 3600 });

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tests = await getPublishedTests();

  const publicPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/mock-tests"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/support"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  const testPages: MetadataRoute.Sitemap = tests.map((test) => ({
    url: absoluteUrl(`/mock-tests/${test.id}`),
    lastModified: test.updated_at ? new Date(test.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...publicPages, ...testPages];
}
