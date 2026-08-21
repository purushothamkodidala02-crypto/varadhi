import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { categoryUrl, examUrl, mockTestUrl, paperUrl, specializationUrl, stateUrl, subjectUrl, UUID_PATTERN } from "@/lib/public-urls";

type Row = Record<string, string | null> & { id: string; slug: string };
type Query = { eq(column: string, value: string): Query; in(column: string, values: string[]): Query; limit(count: number): Query; maybeSingle(): Promise<{ data: Row | null }> };

async function entity(
  supabase: ReturnType<typeof createClient>,
  table: string,
  entityType: string,
  token: string,
  columns: string,
  scope?: (query: Query) => Query,
) {
  let current = supabase.from(table).select(columns) as unknown as Query;
  current = UUID_PATTERN.test(token) ? current.eq("id", token) : current.eq("slug", token);
  const { data } = await (scope ? scope(current) : current).limit(1).maybeSingle();
  if (data) return data;
  if (UUID_PATTERN.test(token)) return null;
  const aliasResult = await supabase.from("public_slug_aliases").select("entity_id").eq("entity_type", entityType).eq("slug", token).limit(20);
  const aliases = aliasResult.data as Array<{ entity_id: string }> | null;
  const ids = (aliases ?? []).map((item) => item.entity_id);
  if (ids.length === 0) return null;
  const previous = supabase.from(table).select(columns).in("id", ids) as unknown as Query;
  const { data: previousData } = await (scope ? scope(previous) : previous).limit(1).maybeSingle();
  return previousData;
}

function keepNonStructuralQuery(request: NextRequest, destination: string) {
  const url = new URL(destination, request.url);
  for (const key of ["q", "type", "page"] as const) {
    const value = request.nextUrl.searchParams.get(key);
    if (value && value !== "all" && !(key === "page" && value === "1")) url.searchParams.set(key, value);
  }
  return url;
}

async function contextFromTest(supabase: ReturnType<typeof createClient>, testToken: string) {
  const test = await entity(supabase, "mock_tests", "mock_test", testToken, "id, slug, paper_id");
  if (!test?.paper_id) return null;
  const paper = await entity(supabase, "papers", "paper", test.paper_id, "id, slug, exam_group_id");
  if (!paper?.exam_group_id) return null;
  const exam = await entity(supabase, "exam_groups", "exam", paper.exam_group_id, "id, slug, exam_id");
  if (!exam?.exam_id) return null;
  const category = await entity(supabase, "exams", "category", exam.exam_id, "id, slug, state_id");
  if (!category?.state_id) return null;
  const state = await entity(supabase, "exam_states", "state", category.state_id, "id, slug");
  return state ? { state, exam, paper, test } : null;
}

export async function resolvePublicPermanentRedirect(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/mock-tests")) return null;
  const segments = request.nextUrl.pathname.split("/").filter(Boolean).slice(1);
  if (segments.includes("attempt") || segments.includes("opengraph-image")) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;
  const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } }) as unknown as ReturnType<typeof createClient>;

  if (segments.length === 1 && UUID_PATTERN.test(segments[0])) {
    const context = await contextFromTest(supabase, segments[0]);
    if (!context) return null;
    return keepNonStructuralQuery(request, mockTestUrl(context.state.slug, context.exam.slug, context.paper.slug, context.test.slug));
  }

  const stateToken = segments[0] ?? request.nextUrl.searchParams.get("state");
  if (!stateToken) return null;
  const state = await entity(supabase, "exam_states", "state", stateToken, "id, slug");
  if (!state) return null;

  const categoryIdsResult = await supabase.from("exams").select("id").eq("state_id", state.id);
  const categoryIds = ((categoryIdsResult.data as Array<{ id: string }> | null) ?? []).map((item) => item.id);
  if (categoryIds.length === 0) return keepNonStructuralQuery(request, stateUrl(state.slug));

  if (segments[1] === "category") {
    const token = segments[2];
    if (!token) return null;
    const category = await entity(supabase, "exams", "category", token, "id, slug, state_id", (query) => query.eq("state_id", state.id));
    return category ? keepNonStructuralQuery(request, categoryUrl(state.slug, category.slug)) : null;
  }

  const categoryToken = request.nextUrl.searchParams.get("category");
  const category = categoryToken
    ? await entity(supabase, "exams", "category", categoryToken, "id, slug, state_id", (query) => query.eq("state_id", state.id))
    : null;
  const examToken = segments[1] ?? request.nextUrl.searchParams.get("exam");
  if (!examToken) return keepNonStructuralQuery(request, category ? categoryUrl(state.slug, category.slug) : stateUrl(state.slug));
  const exam = await entity(supabase, "exam_groups", "exam", examToken, "id, slug, exam_id", (query) => category ? query.eq("exam_id", category.id) : query.in("exam_id", categoryIds));
  if (!exam) return null;

  if (segments[2] === "specialization") {
    const token = segments[3];
    if (!token) return null;
    const specialization = await entity(supabase, "exam_specializations", "specialization", token, "id, slug, exam_group_id", (query) => query.eq("exam_group_id", exam.id));
    return specialization ? keepNonStructuralQuery(request, specializationUrl(state.slug, exam.slug, specialization.slug)) : null;
  }

  const specializationToken = request.nextUrl.searchParams.get("specialization");
  const specialization = specializationToken
    ? await entity(supabase, "exam_specializations", "specialization", specializationToken, "id, slug, exam_group_id", (query) => query.eq("exam_group_id", exam.id))
    : null;
  const paperToken = segments[2] ?? request.nextUrl.searchParams.get("paper");
  if (!paperToken) return keepNonStructuralQuery(request, specialization ? specializationUrl(state.slug, exam.slug, specialization.slug) : examUrl(state.slug, exam.slug));
  const paper = await entity(supabase, "papers", "paper", paperToken, "id, slug, exam_group_id", (query) => query.eq("exam_group_id", exam.id));
  if (!paper) return null;

  if (segments[3] === "subject") {
    const token = segments[4];
    if (!token) return null;
    const subject = await entity(supabase, "subjects", "subject", token, "id, slug, paper_id", (query) => query.eq("paper_id", paper.id));
    return subject ? keepNonStructuralQuery(request, subjectUrl(state.slug, exam.slug, paper.slug, subject.slug)) : null;
  }

  const subjectToken = request.nextUrl.searchParams.get("subject");
  if (subjectToken) {
    const subject = await entity(supabase, "subjects", "subject", subjectToken, "id, slug, paper_id", (query) => query.eq("paper_id", paper.id));
    if (subject) return keepNonStructuralQuery(request, subjectUrl(state.slug, exam.slug, paper.slug, subject.slug));
  }
  const testToken = segments[3];
  if (testToken) {
    const test = await entity(supabase, "mock_tests", "mock_test", testToken, "id, slug, paper_id", (query) => query.eq("paper_id", paper.id));
    if (test) return keepNonStructuralQuery(request, mockTestUrl(state.slug, exam.slug, paper.slug, test.slug));
  }
  return keepNonStructuralQuery(request, paperUrl(state.slug, exam.slug, paper.slug));
}
