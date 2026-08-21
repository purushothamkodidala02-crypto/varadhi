import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MockTestsPage, { type Filters } from "@/app/mock-tests/page";
import { getMockTestCatalogData } from "@/lib/catalog-data";
import { examCollectionPath, examCollectionSlug } from "@/lib/exam-catalog";

type ExamCollectionPageProps = {
  params: Promise<{ id: string; exam: string }>;
  searchParams: Promise<Filters>;
};

async function resolveCollection(stateSlug: string, examSlug: string) {
  const catalog = await getMockTestCatalogData();
  const state = catalog.states.find((item) => item.slug === stateSlug);
  if (!state) return null;
  const categoryIds = new Set(catalog.categories.filter((item) => item.state_id === state.id).map((item) => item.id));
  const exam = catalog.exams.find((item) =>
    categoryIds.has(item.exam_id) && (examCollectionSlug(item.name) === examSlug || item.slug === examSlug)
  );
  return exam ? { state, exam } : null;
}

export async function generateMetadata({ params }: ExamCollectionPageProps): Promise<Metadata> {
  const { id: stateSlug, exam: examSlug } = await params;
  const collection = await resolveCollection(stateSlug, examSlug);
  if (!collection) return { title: "Mock Tests" };
  const title = `${collection.exam.name} Mock Tests in ${collection.state.name}`;
  const description = `Practise ${collection.exam.name} mock tests for ${collection.state.name}. Choose the correct paper, take timed tests, save progress and review every answer.`;
  const canonical = examCollectionPath(collection.state.slug, collection.exam.name);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ExamCollectionPage({ params, searchParams }: ExamCollectionPageProps) {
  const { id: stateSlug, exam: examSlug } = await params;
  const collection = await resolveCollection(stateSlug, examSlug);
  if (!collection) notFound();
  const filters = await searchParams;
  return MockTestsPage({ searchParams: Promise.resolve({ ...filters, state: collection.state.slug, exam: examCollectionSlug(collection.exam.name) }) });
}
