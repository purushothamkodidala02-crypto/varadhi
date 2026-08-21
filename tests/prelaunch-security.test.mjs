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
  const [proxy, config, layout] = await Promise.all([read("proxy.ts"), read("next.config.ts"), read("app/layout.tsx")]);

  assert.match(proxy, /'nonce-\$\{nonce\}'/);
  assert.match(proxy, /'strict-dynamic'/);
  assert.match(proxy, /requestHeaders\.set\("x-nonce", nonce\)/);
  assert.match(layout, /await connection\(\)/);
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
  const testPage = await read("components/mock-tests/MockTestDetailPage.tsx");

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

test("mock-test management preserves filters while editing a test", async () => {
  const [mockTestTable, mockTestPage, editPage] = await Promise.all([
    read("app/admin/mock-tests/ExistingMockTestsTable.tsx"),
    read("app/admin/mock-tests/page.tsx"),
    read("app/admin/mock-tests/[id]/edit/page.tsx"),
  ]);

  assert.match(mockTestTable, /window\.history\.replaceState/);
  assert.match(mockTestTable, /returnTo=\$\{encodeURIComponent\(mockTestAdminUrl\)\}/);
  assert.match(mockTestPage, /initialStateId=\{stateId\}/);
  assert.match(mockTestPage, /initialStatus=\{initialStatus\}/);
  assert.match(editPage, /returnTo\.startsWith\("\/admin\/mock-tests\?"\)/);
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

test("permanent public slugs cover every catalogue level and legacy URLs redirect", async () => {
  const [home, catalog, examRoute, testRoute, helpers, resolver, requestRedirect, proxy, sitemap, migration] = await Promise.all([
    read("app/page.tsx"),
    read("app/mock-tests/page.tsx"),
    read("app/mock-tests/[id]/[exam]/page.tsx"),
    read("app/mock-tests/[id]/[exam]/[paper]/[test]/page.tsx"),
    read("lib/public-urls.ts"),
    read("lib/public-route-data.ts"),
    read("lib/public-redirect.ts"),
    read("proxy.ts"),
    read("app/sitemap.ts"),
    read("supabase/migrations/20260821193000_add_permanent_public_slug_history.sql"),
  ]);

  assert.match(helpers, /stateUrl/);
  assert.match(helpers, /categoryUrl/);
  assert.match(helpers, /specializationUrl/);
  assert.match(helpers, /subjectUrl/);
  assert.match(helpers, /mockTestUrl/);
  assert.match(home, /href=\{examUrl\(state\.slug, exam\.slug\)\}/);
  assert.doesNotMatch(home, /exam=\$\{exam\.id\}/);
  assert.match(catalog, /permanentRedirect\(withQuery\(destination, filters\)\)/);
  assert.match(examRoute, /permanentRedirect\(canonical\)/);
  assert.match(testRoute, /generateMockTestMetadata/);
  assert.match(resolver, /public_slug_aliases/);
  assert.match(resolver, /getMockTestPublicContextById/);
  assert.match(requestRedirect, /public_slug_aliases/);
  assert.match(requestRedirect, /UUID_PATTERN/);
  assert.match(proxy, /NextResponse\.redirect\(permanentDestination, 308\)/);
  assert.match(proxy, /NextResponse\.rewrite[\s\S]*status:\s*404/);
  assert.match(sitemap, /categoryUrl/);
  assert.match(sitemap, /subjectUrl/);
  assert.match(sitemap, /mockTestUrl/);
  assert.match(migration, /create table if not exists public\.public_slug_aliases/);
  assert.match(migration, /remember_previous_public_slug/);
  assert.match(migration, /unique index if not exists public_slug_aliases_scope_unique/);
  assert.match(migration, /mock_tests_slug_format/);
});

test("navigation and question-management links remain accessible", async () => {
  const [navigation, createQuestion, packageJson] = await Promise.all([
    read("components/site/PublicNavigationMenu.tsx"),
    read("app/admin/questions/CreateQuestionForm.tsx"),
    read("package.json"),
  ]);

  assert.match(navigation, /inert=\{!open\}/);
  assert.match(navigation, /aria-modal="true"/);
  assert.match(navigation, /createPortal/);
  assert.match(navigation, /document\.body/);
  assert.match(createQuestion, /id="add-question"/);
  assert.match(packageJson, /"nanoid":\s*"3\.3\.18"/);
});

test("question media imports, uploads, enlargement, and attempt reviews stay connected", async () => {
  const [migration, importer, runner, review, media] = await Promise.all([
    read("supabase/migrations/20260814160000_add_question_media_workflow.sql"),
    read("app/admin/questions/import-actions.ts"),
    read("app/mock-tests/[id]/StudentTestRunner.tsx"),
    read("app/dashboard/attempts/[id]/AttemptReviewNavigator.tsx"),
    read("components/questions/QuestionMedia.tsx"),
  ]);

  assert.match(migration, /question-media/);
  assert.match(migration, /file_size_limit/);
  assert.match(migration, /image_url = excluded\.image_url/);
  assert.match(migration, /snapshot\.image_url/);
  assert.match(importer, /normalizeQuestionImageUrl/);
  assert.match(importer, /worksheet\.getImages\(\)/);
  assert.match(importer, /placement\.range\.tl\.nativeRow \+ 1/);
  assert.match(importer, /uploadQuestionImage/);
  assert.match(importer, /use either the embedded image or image_url/);
  assert.match(importer, /uploadedImagePaths\.map\(\(path\) => removeQuestionImage/);
  assert.match(importer, /image_url: image\.url/);
  assert.match(runner, /<QuestionMedia src=\{current\.image_url\}/);
  assert.match(review, /<QuestionMedia src=\{row\.image_url\}/);
  assert.match(media, /aria-label="Open a larger view of the Question image"/);
  assert.match(media, /aria-modal="true"/);
  assert.match(media, /Zoom in/);
  assert.match(media, /Zoom out/);
  assert.match(media, /max-h-\[42rem\]/);
  assert.match(media, /motion-reduce:transition-none/);
});

test("assertion-reason questions accept short labels and render standard labels", async () => {
  const formatter = await read("components/questions/FormattedQuestionText.tsx");

  assert.match(formatter, /Assertion\(\?:\\s\*\\\(\[A\]\\\)\)\?/);
  assert.match(formatter, /Reason\(\?:\\s\*\\\(\[R\]\\\)\)\?/);
  assert.match(formatter, /return "Assertion \(A\)"/);
  assert.match(formatter, /return "Reason \(R\)"/);
});

test("match questions clean imported markdown and support A-D with I-IV lists", async () => {
  const formatter = await read("components/questions/FormattedQuestionText.tsx");

  assert.match(formatter, /replace\(\/\\u00a0\/g, " "\)/);
  assert.match(formatter, /replace\(\/\\\*\\\*\/g, ""\)/);
  assert.match(formatter, /romanListItem/);
  assert.match(formatter, /\{ left: alphabeticListItem, right: romanListItem \}/);
  assert.match(formatter, /replace\(\/;\\s\*\$\/, ""\)/);
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
  assert.match(testList, /DownloadQuestionsButton/);
});

test("loading feedback is accessible and prevents duplicate operations", async () => {
  const [
    layout,
    navigationProgress,
    pendingSubmitButton,
    routeLoading,
    testStartActions,
    testRunner,
    downloadQuestions,
    errorBoundary,
  ] = await Promise.all([
    read("app/layout.tsx"),
    read("components/feedback/NavigationProgress.tsx"),
    read("components/feedback/PendingSubmitButton.tsx"),
    read("components/feedback/RouteLoading.tsx"),
    read("app/mock-tests/[id]/TestStartActions.tsx"),
    read("app/mock-tests/[id]/StudentTestRunner.tsx"),
    read("app/admin/mock-tests/DownloadQuestionsButton.tsx"),
    read("app/error.tsx"),
  ]);

  assert.match(layout, /<NavigationProgress/);
  assert.match(navigationProgress, /role="status"/);
  assert.match(navigationProgress, /aria-live="polite"/);
  assert.match(navigationProgress, /motion-reduce:animate-none/);
  assert.match(navigationProgress, /This is taking longer than expected/);
  assert.match(navigationProgress, /sourceHref: window\.location\.href/);
  assert.match(navigationProgress, /window\.location\.href === activeNavigation\.sourceHref/);
  assert.match(navigationProgress, /window\.setInterval\(clearIfUrlChanged, 100\)/);
  assert.match(navigationProgress, /new FormData\(form\)/);
  assert.match(navigationProgress, /form\.getAttribute\("method"\)/);
  assert.match(navigationProgress, /declaredMethod !== "get"/);
  assert.match(pendingSubmitButton, /useFormStatus/);
  assert.match(pendingSubmitButton, /disabled=\{disabled \|\| pending\}/);
  assert.match(pendingSubmitButton, /aria-busy=\{pending\}/);
  assert.match(routeLoading, /aria-busy="true"/);
  assert.match(routeLoading, /motion-reduce:animate-none/);
  assert.match(testStartActions, /pendingLabel="Starting test…"/);
  assert.match(testStartActions, /pendingLabel="Resuming test…"/);
  assert.match(testRunner, /aria-busy=\{submitting\}/);
  assert.match(testRunner, /PendingButtonContent/);
  assert.match(downloadQuestions, /if \(pending\) return/);
  assert.match(downloadQuestions, /disabled=\{pending\}/);
  assert.match(downloadQuestions, /try again/i);
  assert.match(errorBoundary, /<RetryButton/);
});

test("student, authentication, and admin route groups have loading boundaries", async () => {
  const loadingFiles = [
    "app/loading.tsx",
    "app/mock-tests/loading.tsx",
    "app/mock-tests/[id]/loading.tsx",
    "app/mock-tests/[id]/attempt/loading.tsx",
    "app/dashboard/loading.tsx",
    "app/login/loading.tsx",
    "app/register/loading.tsx",
    "app/forgot-password/loading.tsx",
    "app/reset-password/loading.tsx",
    "app/recover-account/loading.tsx",
    "app/admin-mfa/loading.tsx",
    "app/admin/loading.tsx",
  ];

  const boundaries = await Promise.all(loadingFiles.map(read));
  for (const boundary of boundaries) {
    assert.match(boundary, /RouteLoading/);
  }
});

test("student attempt history keeps lifetime summaries and limits detailed snapshots", async () => {
  const [migration, dashboard, reviewPage] = await Promise.all([
    read("supabase/migrations/20260821220000_add_attempt_history_retention.sql"),
    read("app/dashboard/page.tsx"),
    read("app/dashboard/attempts/[id]/page.tsx"),
  ]);

  assert.match(migration, /detailed_review_available boolean not null default true/);
  assert.match(migration, /get_student_attempt_history_summary/);
  assert.match(migration, /attempt_rank > 100/);
  assert.match(migration, /interval '365 days'/);
  assert.match(migration, /interval '30 days'/);
  assert.match(migration, /cron\.schedule/);
  assert.match(dashboard, /const attemptsPerPage = 20/);
  assert.match(dashboard, /\.range\(\(page - 1\) \* attemptsPerPage/);
  assert.match(dashboard, /attempt\.detailed_review_available/);
  assert.match(dashboard, /Summary only/);
  assert.match(reviewPage, /Detailed answer review is no longer stored/);
  assert.match(reviewPage, /latest 100 attempts/);
});

test("mock-test question targets and destructive operations are database protected", async () => {
  const [migration, createAction, editPage, importer, assignments, deleteAction] = await Promise.all([
    read("supabase/migrations/20260821230000_add_safe_mock_question_management.sql"),
    read("app/admin/mock-tests/actions.ts"),
    read("app/admin/mock-tests/[id]/edit/page.tsx"),
    read("app/admin/questions/import-actions.ts"),
    read("app/admin/mock-tests/[id]/edit/QuestionAssignments.tsx"),
    read("app/admin/questions/deleteAction.ts"),
  ]);

  assert.match(migration, /target_question_count integer/);
  assert.match(migration, /mock_tests_target_question_count_positive/);
  assert.match(migration, /guard_mock_test_question_mutation/);
  assert.match(migration, /has student attempts and its Questions are locked/);
  assert.match(migration, /already has its target number of Questions/);
  assert.match(migration, /fill_mock_test_with_latest_questions/);
  assert.match(migration, /replace_mock_test_questions_atomic/);
  assert.match(migration, /must contain exactly % valid Questions/);
  assert.match(migration, /delete from public\.questions as question/);
  assert.match(migration, /test_attempt_session_questions where question_id/);
  assert.match(migration, /attempt_responses where question_id/);
  assert.match(migration, /actual_question_count <> test_record\.target_question_count/);
  assert.match(createAction, /paper\.question_count \?\? requestedTarget/);
  assert.match(editPage, /targetQuestionCount=\{test\.target_question_count\}/);
  assert.match(importer, /mode === "replace"/);
  assert.match(importer, /replace_mock_test_questions_atomic/);
  assert.match(importer, /questionMediaPath/);
  assert.match(assignments, /Fill remaining with latest/);
  assert.match(assignments, /moveAssignedQuestion/);
  assert.match(assignments, /options=\{availableQuestions\.map/);
  assert.match(assignments, /No unassigned Question matches those words/);
  assert.doesNotMatch(assignments, /matchingQuestions\.slice/);
  assert.match(deleteAction, /delete_question_safely/);
  assert.match(deleteAction, /makeQuestionUnavailable/);
});
