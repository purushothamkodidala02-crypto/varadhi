import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import MockTestsPage, { type Filters } from "@/app/mock-tests/page";
import { JsonLd } from "@/components/seo/JsonLd";
import { resolvePublicRoute } from "@/lib/public-route-data";
import { collectionStructuredData, isIndexableCollectionQuery, publicCollectionMetadata } from "@/lib/public-seo";
import { categoryUrl, stateUrl } from "@/lib/public-urls";
import { resolveSeoFields } from "@/lib/seo-fields";

type Props = { params: Promise<{ id: string; category: string }>; searchParams: Promise<Filters> };
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> { const { id, category } = await params; const c = await resolvePublicRoute({ stateSlug: id, categorySlug: category }); if (!c?.category) return { title: "Exam Category Not Found", robots: { index: false, follow: false } }; const canonical = categoryUrl(c.state.slug, c.category.slug); const seo = resolveSeoFields(c.category, { title: `${c.category.name} Mock Tests in ${c.state.name}`, description: `Browse ${c.category.name} exams and free mock tests for ${c.state.name}.` }); return publicCollectionMetadata({ ...seo, canonical, indexable: isIndexableCollectionQuery(await searchParams) }); }
export default async function CategoryPage({ params, searchParams }: Props) { const { id, category } = await params; const c = await resolvePublicRoute({ stateSlug: id, categorySlug: category }); if (!c?.category) notFound(); const canonical = categoryUrl(c.state.slug, c.category.slug); if (c.usedAlias || id !== c.state.slug || category !== c.category.slug) permanentRedirect(canonical); const seo = resolveSeoFields(c.category, { title: `${c.category.name} Mock Tests in ${c.state.name}`, description: `Browse ${c.category.name} exams and free mock tests for ${c.state.name}.` }); return <><JsonLd data={collectionStructuredData(seo.title, seo.description, canonical, [{ name: "Home", path: "/" }, { name: "Mock tests", path: "/mock-tests" }, { name: c.state.name, path: stateUrl(c.state.slug) }, { name: c.category.name, path: canonical }])} />{await MockTestsPage({ searchParams: Promise.resolve({ ...(await searchParams), state: c.state.slug, category: c.category.slug }), canonicalPath: canonical })}</>; }
