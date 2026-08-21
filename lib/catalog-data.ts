import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export const PUBLIC_CATALOG_TAG = "public-catalog";

export const getHomeCatalogData = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [statesResult, categoriesResult, examsResult, papersResult, testsResult] =
      await Promise.all([
        supabase.from("exam_states").select("id, name, code, slug, description, seo_title, seo_description, display_order").eq("is_active", true).order("display_order"),
        supabase.from("exams").select("id, state_id, name, slug").eq("is_active", true).order("display_order"),
        supabase.from("exam_groups").select("id, exam_id, name, slug").eq("is_active", true).order("display_order"),
        supabase.from("papers").select("id, exam_group_id").eq("is_active", true),
        supabase.from("mock_tests").select("id, paper_id").eq("status", "published").eq("access_type", "free"),
      ]);

    return {
      states: statesResult.data ?? [],
      categories: categoriesResult.data ?? [],
      exams: examsResult.data ?? [],
      papers: papersResult.data ?? [],
      tests: testsResult.data ?? [],
      hasStateError: Boolean(statesResult.error),
    };
  },
  ["home-catalog-v2"],
  { tags: [PUBLIC_CATALOG_TAG], revalidate: 300 },
);

export const getMockTestCatalogData = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [statesResult, categoriesResult, examsResult, specializationsResult, papersResult, subjectsResult, testsResult, statsResult] = await Promise.all([
      supabase.from("exam_states").select("id, name, code, slug, description, seo_title, seo_description, display_order").eq("is_active", true).order("display_order"),
      supabase.from("exams").select("id, state_id, name, slug, seo_title, seo_description").eq("is_active", true).order("display_order"),
      supabase.from("exam_groups").select("id, exam_id, name, slug, seo_title, seo_description").eq("is_active", true).order("display_order"),
      supabase.from("exam_specializations").select("id, exam_group_id, name, slug, description, seo_title, seo_description").eq("is_active", true).order("display_order"),
      supabase.from("papers").select("id, exam_group_id, specialization_id, name, slug, description, seo_title, seo_description, display_order, question_count, default_correct_marks").eq("is_active", true).order("display_order"),
      supabase.from("subjects").select("id, paper_id, name, slug, description, seo_title, seo_description").eq("is_active", true).order("display_order"),
      supabase.from("mock_tests").select("id, paper_id, subject_id, test_scope, series_number, title, slug, description, seo_title, seo_description, duration_minutes, access_type, price_inr, updated_at").eq("status", "published").eq("access_type", "free").order("series_number"),
      supabase.rpc("get_published_mock_test_stats"),
    ]);

    return {
      states: statesResult.data ?? [],
      categories: categoriesResult.data ?? [],
      exams: examsResult.data ?? [],
      specializations: specializationsResult.data ?? [],
      papers: papersResult.data ?? [],
      subjects: subjectsResult.data ?? [],
      tests: testsResult.data ?? [],
      stats: statsResult.data ?? [],
      hasError: Boolean(
        statesResult.error ||
          categoriesResult.error ||
          examsResult.error ||
          specializationsResult.error ||
          papersResult.error ||
          subjectsResult.error ||
          testsResult.error ||
          statsResult.error,
      ),
    };
  },
  ["mock-test-catalog-v2"],
  { tags: [PUBLIC_CATALOG_TAG], revalidate: 300 },
);
