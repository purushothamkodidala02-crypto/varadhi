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

export default async function TakeMockTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/mock-tests/${id}/attempt`)}`);

  const { data: mockTest } = await supabase.from("mock_tests").select("id, title, status, access_type").eq("id", id).eq("status", "published").maybeSingle();
  if (!mockTest) notFound();
  let hasAccess = mockTest.access_type === "free";
  if (mockTest.access_type === "paid") {
    const { data: entitlement } = await supabase.from("mock_test_entitlements").select("id").eq("mock_test_id", mockTest.id).maybeSingle();
    hasAccess = Boolean(entitlement);
  }
  if (!hasAccess) return <TestNotReady title={mockTest.title} testId={id} message="This mock test is not publicly available right now." />;

  const { data: sessionData, error: sessionError } = await supabase.rpc("start_mock_test_session", { requested_mock_test_id: id });
  const session = sessionData?.[0] as { session_id: string; expires_at: string } | undefined;
  if (sessionError || !session) {
    const noActiveQuestions = /no active questions/i.test(sessionError?.message ?? "");
    return <TestNotReady title={mockTest.title} testId={id} message={noActiveQuestions ? "This mock test does not have active questions available yet. Please try again later." : "This mock test could not be started. Its administrator needs to review the setup."} />;
  }

  const { data, error } = await supabase.rpc("get_mock_test_session_payload", { requested_session_id: session.session_id });
  const questions = (data ?? []) as TestQuestion[];
  if (error || questions.length === 0) return <TestNotReady title={mockTest.title} testId={id} message="This mock test does not have active questions available yet. Please try again later." />;
  return <StudentTestRunner mockTestId={id} title={mockTest.title} sessionId={session.session_id} expiresAt={session.expires_at} questions={questions} />;
}
