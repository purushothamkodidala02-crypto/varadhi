import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { generateMockTestMetadata, MockTestDetailsPage } from "@/components/mock-tests/MockTestDetailPage";
import { resolvePublicRoute } from "@/lib/public-route-data";
import { mockTestUrl } from "@/lib/public-urls";
type Props = { params: Promise<{ id: string; exam: string; paper: string; test: string }>; searchParams: Promise<{ start_error?: string }> };
async function context(params: Props["params"]) { const p = await params; return { p, c: await resolvePublicRoute({ stateSlug: p.id, examSlug: p.exam, paperSlug: p.paper, mockTestSlug: p.test }) }; }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { c } = await context(params); if (!c?.exam || !c.paper || !c.mockTest) return { title: "Mock Test Not Found", robots: { index: false, follow: false } }; return generateMockTestMetadata({ id: c.mockTest.id, canonicalPath: mockTestUrl(c.state.slug, c.exam.slug, c.paper.slug, c.mockTest.slug) }); }
export default async function TestPage({ params, searchParams }: Props) { const { p, c } = await context(params); if (!c?.exam || !c.paper || !c.mockTest) notFound(); const canonical = mockTestUrl(c.state.slug, c.exam.slug, c.paper.slug, c.mockTest.slug); if (c.usedAlias || p.id !== c.state.slug || p.exam !== c.exam.slug || p.paper !== c.paper.slug || p.test !== c.mockTest.slug) permanentRedirect(canonical); return MockTestDetailsPage({ id: c.mockTest.id, canonicalPath: canonical, searchParams }); }
