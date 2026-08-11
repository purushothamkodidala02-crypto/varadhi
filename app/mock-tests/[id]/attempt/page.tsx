import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentTestRunner } from "../StudentTestRunner";

type TestQuestion = {
  question_id: string;
  question_order: number;
  marks: number;
  negative_marks: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  image_url: string | null;
  selected_answer: "A" | "B" | "C" | "D" | null;
  marked_for_review: boolean;
  content_language_mode: "bilingual" | "english" | "telugu";
  question_text_te: string | null;
  option_a_te: string | null;
  option_b_te: string | null;
  option_c_te: string | null;
  option_d_te: string | null;
};

function TestNotReady({ title, message, testId }: { title: string; message: string; testId: string }) {
  return <main className="min-h-screen bg-slate-50 px-5 py-16"><section className="mx-auto max-w-2xl rounded-3xl border bg-white p-8 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Test unavailable</p><h1 className="mt-3 text-3xl font-black text-slate-950">{title}</h1><p className="mt-4 leading-7 text-slate-600">{message}</p><Link href={`/mock-tests/${testId}`} className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Back to test details</Link></section></main>;
}

export default async function TakeMockTestPage({ params, searchParams }: PageProps<"/mock-tests/[id]/attempt">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/mock-tests/${id}`)}`);

  const { data: mockTest } = await supabase.from("mock_tests").select("id, title, status, access_type").eq("id", id).eq("status", "published").maybeSingle();
  if (!mockTest) notFound();
  let hasAccess = mockTest.access_type === "free";
  if (mockTest.access_type === "paid") {
    const { data: entitlement } = await supabase.from("mock_test_entitlements").select("id").eq("mock_test_id", mockTest.id).maybeSingle();
    hasAccess = Boolean(entitlement);
  }
  if (!hasAccess) return <TestNotReady title={mockTest.title} testId={id} message="This mock test is not publicly available right now." />;

  const requestedSessionId = typeof query.session === "string" ? query.session : "";
  if (!/^[0-9a-f-]{36}$/i.test(requestedSessionId)) redirect(`/mock-tests/${id}`);

  const { data: session } = await supabase
    .from("test_attempt_sessions")
    .select("id, expires_at, session_state")
    .eq("id", requestedSessionId)
    .eq("mock_test_id", id)
    .is("submitted_at", null)
    .maybeSingle();
  if (!session || session.session_state !== "active") redirect(`/mock-tests/${id}`);

  const { data, error } = await supabase.rpc("get_mock_test_session_payload", { requested_session_id: session.id });
  const questions = (data ?? []) as TestQuestion[];
  if (error || questions.length === 0) return <TestNotReady title={mockTest.title} testId={id} message="This mock test does not have active questions available yet. Please try again later." />;
  return <StudentTestRunner mockTestId={id} title={mockTest.title} sessionId={session.id} expiresAt={session.expires_at} questions={questions} />;
}
