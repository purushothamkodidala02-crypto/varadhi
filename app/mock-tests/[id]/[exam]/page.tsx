import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import MockTestsPage, { type Filters } from "@/app/mock-tests/page";
import { JsonLd } from "@/components/seo/JsonLd";
import { resolvePublicRoute } from "@/lib/public-route-data";
import { collectionStructuredData, isIndexableCollectionQuery, publicCollectionMetadata } from "@/lib/public-seo";
import { examUrl, stateUrl } from "@/lib/public-urls";
import { resolveSeoFields } from "@/lib/seo-fields";

type Props = { params: Promise<{ id: string; exam: string }>; searchParams: Promise<Filters> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id, exam } = await params;
  const context = await resolvePublicRoute({ stateSlug: id, examSlug: exam });
  if (!context?.exam) return { title: "Exam Mock Tests Not Found", robots: { index: false, follow: false } };
  const canonical = examUrl(context.state.slug, context.exam.slug);
  const seo = resolveSeoFields(context.exam, { title: `${context.exam.name} Mock Tests in ${context.state.name}`, description: `Practise free ${context.exam.name} mock tests for ${context.state.name}. Choose a paper, take timed tests and review every answer.` });
  return publicCollectionMetadata({ ...seo, canonical, indexable: isIndexableCollectionQuery(await searchParams) });
}

export default async function ExamPage({ params, searchParams }: Props) {
  const { id, exam } = await params;
  const context = await resolvePublicRoute({ stateSlug: id, examSlug: exam });
  if (!context?.exam) notFound();
  const canonical = examUrl(context.state.slug, context.exam.slug);
  if (context.usedAlias || id !== context.state.slug || exam !== context.exam.slug) permanentRedirect(canonical);
  const seo = resolveSeoFields(context.exam, { title: `${context.exam.name} Mock Tests in ${context.state.name}`, description: `Practise free ${context.exam.name} mock tests for ${context.state.name}. Choose a paper, take timed tests and review every answer.` });
  return <><JsonLd data={collectionStructuredData(seo.title, seo.description, canonical, [{ name: "Home", path: "/" }, { name: "Mock tests", path: "/mock-tests" }, { name: context.state.name, path: stateUrl(context.state.slug) }, { name: context.exam.name, path: canonical }])} />{await MockTestsPage({ searchParams: Promise.resolve({ ...(await searchParams), state: context.state.slug, exam: context.exam.slug }), canonicalPath: canonical })}</>;
}
