import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data: tests } = await supabase
    .from("mock_tests")
    .select("id, updated_at")
    .eq("status", "published")
    .eq("access_type", "free")
    .order("display_order");

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
  ];

  const testPages: MetadataRoute.Sitemap = (tests ?? []).map((test) => ({
    url: absoluteUrl(`/mock-tests/${test.id}`),
    lastModified: test.updated_at ? new Date(test.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...publicPages, ...testPages];
}
