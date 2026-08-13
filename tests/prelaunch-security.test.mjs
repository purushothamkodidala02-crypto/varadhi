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
