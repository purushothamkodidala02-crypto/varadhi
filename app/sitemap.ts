import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { absoluteUrl } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";
import { getMockTestCatalogData, PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";
import { examCollectionPath } from "@/lib/exam-catalog";

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
  const [tests, catalog] = await Promise.all([getPublishedTests(), getMockTestCatalogData()]);

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

  const paperById = new Map(catalog.papers.map((paper) => [paper.id, paper]));
  const examById = new Map(catalog.exams.map((exam) => [exam.id, exam]));
  const categoryById = new Map(catalog.categories.map((category) => [category.id, category]));
  const stateById = new Map(catalog.states.map((state) => [state.id, state]));
  const publishedExamIds = new Set(catalog.tests.map((test) => paperById.get(test.paper_id)?.exam_group_id).filter((id): id is string => Boolean(id)));
  const collectionPages: MetadataRoute.Sitemap = [...publishedExamIds].flatMap((examId) => {
    const exam = examById.get(examId);
    const category = exam ? categoryById.get(exam.exam_id) : undefined;
    const state = category ? stateById.get(category.state_id) : undefined;
    return exam && state ? [{ url: absoluteUrl(examCollectionPath(state.slug, exam.name)), changeFrequency: "daily" as const, priority: 0.85 }] : [];
  });

  return [...publicPages, ...collectionPages, ...testPages];
}
