import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import MockTestsPage, { type Filters } from "@/app/mock-tests/page";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateMockTestMetadata } from "@/components/mock-tests/MockTestDetailPage";
import { getMockTestPublicContextById, resolvePublicRoute } from "@/lib/public-route-data";
import { collectionStructuredData, isIndexableCollectionQuery, publicCollectionMetadata } from "@/lib/public-seo";
import { mockTestUrl, stateUrl, UUID_PATTERN } from "@/lib/public-urls";
import { resolveSeoFields } from "@/lib/seo-fields";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Filters> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  if (UUID_PATTERN.test(id)) {
    const context = await getMockTestPublicContextById(id);
    if (!context) return { title: "Mock Test Not Found", robots: { index: false, follow: false } };
    const canonical = mockTestUrl(context.state.slug, context.exam.slug, context.paper.slug, context.mockTest.slug);
    return generateMockTestMetadata({ id, canonicalPath: canonical });
  }
  const context = await resolvePublicRoute({ stateSlug: id });
  if (!context) return { title: "State Mock Tests Not Found", robots: { index: false, follow: false } };
  const canonical = stateUrl(context.state.slug);
  const seo = resolveSeoFields(context.state, {
    title: `${context.state.name} Mock Tests`,
    description: `Browse free ${context.state.name} exam mock tests by exam and paper on Varadhi Prep.`,
  });
  return publicCollectionMetadata({
    ...seo,
    canonical,
    indexable: isIndexableCollectionQuery(await searchParams),
  });
}

export default async function StateOrLegacyTestPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (UUID_PATTERN.test(id)) {
    const context = await getMockTestPublicContextById(id);
    if (!context) notFound();
    permanentRedirect(mockTestUrl(context.state.slug, context.exam.slug, context.paper.slug, context.mockTest.slug));
  }
  const context = await resolvePublicRoute({ stateSlug: id });
  if (!context) notFound();
  const canonical = stateUrl(context.state.slug);
  if (context.usedAlias || id !== context.state.slug) permanentRedirect(canonical);
  const seo = resolveSeoFields(context.state, { title: `${context.state.name} Mock Tests`, description: `Browse free ${context.state.name} exam mock tests by exam and paper on Varadhi Prep.` });
  return <><JsonLd data={collectionStructuredData(seo.title, seo.description, canonical, [{ name: "Home", path: "/" }, { name: "Mock tests", path: "/mock-tests" }, { name: context.state.name, path: canonical }])} />{await MockTestsPage({ searchParams: Promise.resolve({ ...(await searchParams), state: context.state.slug }), canonicalPath: canonical })}</>;
}
