import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("all public catalogue levels support optional custom search metadata", async () => {
  const [migration, catalog, examRoute, subjectRoute, testPage, fields] = await Promise.all([
    read("supabase/migrations/20260821213000_add_catalog_seo_fields.sql"),
    read("lib/catalog-data.ts"),
    read("app/mock-tests/[id]/[exam]/page.tsx"),
    read("app/mock-tests/[id]/[exam]/[paper]/subject/[subject]/page.tsx"),
    read("components/mock-tests/MockTestDetailPage.tsx"),
    read("lib/seo-fields.ts"),
  ]);
  for (const table of ["exam_states", "exams", "exam_groups", "exam_specializations", "papers", "subjects", "mock_tests"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table}[\\s\\S]*?seo_title text[\\s\\S]*?seo_description text`));
  }
  assert.match(catalog, /seo_title, seo_description/);
  assert.match(examRoute, /resolveSeoFields\(context\.exam/);
  assert.match(subjectRoute, /resolveSeoFields\(c\.subject/);
  assert.match(testPage, /resolveSeoFields\(test/);
  assert.match(fields, /fallback\.title/);
  assert.match(fields, /fallback\.description/);
});

test("admin SEO fields are validated, optional, and independent from slugs", async () => {
  const [fields, form, action, stateManager, migration] = await Promise.all([
    read("lib/seo-fields.ts"),
    read("components/admin/SeoFields.tsx"),
    read("app/admin/seo/actions.ts"),
    read("app/admin/exams/StateManager.tsx"),
    read("supabase/migrations/20260821213000_add_catalog_seo_fields.sql"),
  ]);
  assert.match(fields, /SEO_TITLE_MAX_LENGTH = 100/);
  assert.match(fields, /SEO_DESCRIPTION_MAX_LENGTH = 320/);
  assert.match(form, /Do not add “\| Varadhi Prep”/);
  assert.match(action, /profile\?\.role !== "admin"/);
  assert.match(action, /tableByType/);
  assert.match(stateManager, /Save search appearance/);
  assert.match(migration, /Telangana Police Constable Mock Test 2026 – Free Online Tests/);
});
