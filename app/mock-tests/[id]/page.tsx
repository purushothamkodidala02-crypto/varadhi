import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentTestRunner } from "./StudentTestRunner";

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

function TestNotReady({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <section className="rounded-2xl border bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          Test being prepared
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-4 text-slate-600">{message}</p>
        <Link href="/mock-tests" className="mt-6 inline-flex rounded-lg bg-black px-5 py-3 font-medium text-white">
          Back to Mock Tests
        </Link>
      </section>
    </main>
  );
}

export default async function TakeMockTestPage({ params }: PageProps<"/mock-tests/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(`/mock-tests/${id}`)}`);

  const { data: mockTest } = await supabase
    .from("mock_tests")
    .select("id, title, duration_minutes, status, access_type, price_inr")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!mockTest) notFound();

  let hasAccess = mockTest.access_type === "free";

  if (mockTest.access_type === "paid") {
    const { data: entitlement } = await supabase
      .from("mock_test_entitlements")
      .select("id")
      .eq("mock_test_id", mockTest.id)
      .maybeSingle();

    hasAccess = Boolean(entitlement);
  }

  if (!hasAccess) {
    return <main className="mx-auto max-w-2xl px-6 py-16"><section className="rounded-2xl border bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Paid Mock Test</p><h1 className="mt-2 text-3xl font-bold">{mockTest.title}</h1><p className="mt-4 text-gray-600">This Mock Test costs ₹{mockTest.price_inr}. Online purchase will be available here soon.</p><Link href="/mock-tests" className="mt-6 inline-flex rounded-lg bg-black px-5 py-3 font-medium text-white">Back to Mock Tests</Link></section></main>;
  }

  const { data: sessionData, error: sessionError } = await supabase.rpc("start_mock_test_session", {
    requested_mock_test_id: id,
  });

  const session = sessionData?.[0] as
    | { session_id: string; expires_at: string }
    | undefined;

  if (sessionError || !session) {
    const noActiveQuestions = /no active questions/i.test(sessionError?.message ?? "");
    return <TestNotReady title={mockTest.title} message={noActiveQuestions ? "This mock test does not have active questions available yet. Please try again later." : "This mock test could not be started. Its administrator needs to review the test setup."} />;
  }

  const { data, error } = await supabase.rpc("get_mock_test_session_payload", {
    requested_session_id: session.session_id,
  });

  const questions = (data ?? []) as TestQuestion[];
  if (error || questions.length === 0) return <TestNotReady title={mockTest.title} message="This mock test does not have active questions available yet. Please try again later." />;

  return <StudentTestRunner title={mockTest.title} sessionId={session.session_id} expiresAt={session.expires_at} questions={questions} />;
}
