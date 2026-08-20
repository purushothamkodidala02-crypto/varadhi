import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("test attempts start only through a validated POST server action", async () => {
  const [buttons, action, attemptPage] = await Promise.all([
    read("app/mock-tests/[id]/TestStartActions.tsx"),
    read("app/mock-tests/[id]/start-actions.ts"),
    read("app/mock-tests/[id]/attempt/page.tsx"),
  ]);

  assert.doesNotMatch(buttons, /href=.*attempt\?mode=/);
  assert.match(buttons, /<form action=/);
  assert.match(action, /"use server"/);
  assert.match(action, /start_mock_test_session|restart_mock_test_session/);
  assert.match(attemptPage, /query\.session/);
  assert.doesNotMatch(attemptPage, /start_mock_test_session|restart_mock_test_session/);
});

test("database migration locks sessions and makes submission idempotent", async () => {
  const migration = await read("supabase/migrations/20260811233000_prelaunch_test_engine_hardening.sql");

  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /for update/);
  assert.match(migration, /uq_test_attempt_sessions_one_unfinished/);
  assert.match(migration, /alter column selected_answer drop not null/);
  assert.match(migration, /marked_for_review boolean/);
  assert.match(migration, /if session_record\.submitted_at is not null then/);
  assert.match(migration, /publish_mock_test_safely/);
  assert.match(migration, /if not public\.is_admin\(\) then/);
  assert.match(migration, /import_questions_atomic/);
  assert.match(migration, /create_exam_structure_atomic/);
});

test("production CSP uses per-request nonces and no production unsafe-inline scripts", async () => {
  const [proxy, config] = await Promise.all([read("proxy.ts"), read("next.config.ts")]);

  assert.match(proxy, /'nonce-\$\{nonce\}'/);
  assert.match(proxy, /'strict-dynamic'/);
  assert.match(proxy, /requestHeaders\.set\("x-nonce", nonce\)/);
  assert.doesNotMatch(config, /Content-Security-Policy/);
  assert.doesNotMatch(proxy, /script-src[^\n]*unsafe-inline/);
});

test("launch policy enforces strong passwords and disables unverified paid tests", async () => {
  const [policy, createAction, updateAction, createForm] = await Promise.all([
    read("lib/auth/password-policy.ts"),
    read("app/admin/mock-tests/actions.ts"),
    read("app/admin/mock-tests/[id]/edit/actions.ts"),
    read("app/admin/mock-tests/CreateMockTestForm.tsx"),
  ]);

  assert.match(policy, /MIN_PASSWORD_LENGTH = 10/);
  assert.match(createAction, /access_type: "free"/);
  assert.match(updateAction, /access_type: "free"/);
  assert.doesNotMatch(createForm, /value="paid"/);
});

test("password recovery works across devices without consuming tokens on email prefetch", async () => {
  const [recoveryRoute, confirmationPage, forgotPasswordForm] = await Promise.all([
    read("app/auth/recovery/route.ts"),
    read("app/recover-account/page.tsx"),
    read("app/forgot-password/ForgotPasswordForm.tsx"),
  ]);

  assert.match(recoveryRoute, /token_hash/);
  assert.match(recoveryRoute, /type:\s*"recovery"/);
  assert.match(recoveryRoute, /verifyOtp/);
  assert.match(recoveryRoute, /export async function POST/);
  assert.match(recoveryRoute, /mail security scanners frequently prefetch links/);
  assert.doesNotMatch(
    recoveryRoute.match(/export async function GET[\s\S]*?export async function POST/)?.[0] ?? "",
    /verifyOtp/,
  );
  assert.match(confirmationPage, /method="post"/);
  assert.match(confirmationPage, /action="\/auth\/recovery"/);
  assert.match(forgotPasswordForm, /opened on any phone, tablet, or computer/);
});

test("first-time mock-test screen does not claim progress is already saved", async () => {
  const testPage = await read("app/mock-tests/[id]/page.tsx");

  assert.doesNotMatch(testPage, /Saved during the attempt/);
  assert.match(testPage, /hasResumableSession[\s\S]*Saved — ready to resume/);
  assert.match(testPage, /Select Start test when you are ready/);
});

test("question bank preserves filters while editing an existing question", async () => {
  const [questionBank, editPage] = await Promise.all([
    read("app/admin/questions/QuestionBankTable.tsx"),
    read("app/admin/questions/[id]/edit/page.tsx"),
  ]);

  assert.match(questionBank, /window\.history\.replaceState/);
  assert.match(questionBank, /returnTo=\$\{encodeURIComponent\(questionBankUrl\)\}/);
  assert.match(editPage, /returnTo\.startsWith\("\/admin\/questions\?"\)/);
  assert.match(editPage, /href=\{backHref\}/);
});

test("public pages expose route-specific SEO metadata and crawl targets", async () => {
  const [layout, catalog, support, sitemap, robots] = await Promise.all([
    read("app/layout.tsx"),
    read("app/mock-tests/page.tsx"),
    read("app/support/page.tsx"),
    read("app/sitemap.ts"),
    read("app/robots.ts"),
  ]);

  assert.doesNotMatch(layout, /alternates:\s*\{\s*canonical:\s*"\/"/);
  assert.match(catalog, /openGraph:[\s\S]*url:\s*"\/mock-tests"/);
  assert.match(support, /title:\s*"Contact Support"/);
  assert.match(support, /"@type":\s*"ContactPage"/);
  assert.match(sitemap, /absoluteUrl\("\/support"\)/);
  assert.match(robots, /host:\s*absoluteUrl\("\/"\)/);
});

test("navigation and question-management links remain accessible", async () => {
  const [navigation, createQuestion, packageJson] = await Promise.all([
    read("components/site/PublicNavigationMenu.tsx"),
    read("app/admin/questions/CreateQuestionForm.tsx"),
    read("package.json"),
  ]);

  assert.match(navigation, /inert=\{!open\}/);
  assert.match(navigation, /aria-modal="true"/);
  assert.match(createQuestion, /id="add-question"/);
  assert.match(packageJson, /"nanoid":\s*"3\.3\.18"/);
});

test("question media imports, uploads, and attempt reviews stay connected", async () => {
  const [migration, importer, runner, review] = await Promise.all([
    read("supabase/migrations/20260814160000_add_question_media_workflow.sql"),
    read("app/admin/questions/import-actions.ts"),
    read("app/mock-tests/[id]/StudentTestRunner.tsx"),
    read("app/dashboard/attempts/[id]/AttemptReviewNavigator.tsx"),
  ]);

  assert.match(migration, /question-media/);
  assert.match(migration, /file_size_limit/);
  assert.match(migration, /image_url = excluded\.image_url/);
  assert.match(migration, /snapshot\.image_url/);
  assert.match(importer, /normalizeQuestionImageUrl/);
  assert.match(importer, /image_url: image\.url/);
  assert.match(runner, /<QuestionMedia src=\{current\.image_url\}/);
  assert.match(review, /<QuestionMedia src=\{row\.image_url\}/);
});

test("assertion-reason questions accept short labels and render standard labels", async () => {
  const formatter = await read("components/questions/FormattedQuestionText.tsx");

  assert.match(formatter, /Assertion\(\?:\\s\*\\\(\[A\]\\\)\)\?/);
  assert.match(formatter, /Reason\(\?:\\s\*\\\(\[R\]\\\)\)\?/);
  assert.match(formatter, /return "Assertion \(A\)"/);
  assert.match(formatter, /return "Reason \(R\)"/);
});

test("admins can export mock-test questions in the accepted import format", async () => {
  const [importer, format, exportRoute, testList] = await Promise.all([
    read("app/admin/questions/import-actions.ts"),
    read("lib/questions/import-format.ts"),
    read("app/admin/mock-tests/[id]/questions-export/route.ts"),
    read("app/admin/mock-tests/ExistingMockTestsTable.tsx"),
  ]);

  assert.match(importer, /QUESTION_IMPORT_REQUIRED_HEADERS/);
  assert.match(format, /QUESTION_IMPORT_EXPORT_HEADERS/);
  assert.match(format, /"question_order"/);
  assert.match(format, /"negative_marks"/);
  assert.match(format, /"image_url"/);
  assert.match(exportRoute, /getWorksheet|addWorksheet\("Varadhi Import"/);
  assert.match(exportRoute, /profile\?\.role !== "admin"/);
  assert.match(exportRoute, /\.order\("question_order"\)/);
  assert.match(exportRoute, /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
  assert.match(testList, /Download questions/);
});
