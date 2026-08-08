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
};

export default async function TakeMockTestPage({ params }: PageProps<"/mock-tests/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: mockTest } = await supabase
    .from("mock_tests")
    .select("id, title, duration_minutes, status, access_type, price_inr")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!mockTest) notFound();

  if (mockTest.access_type === "paid") {
    return <main className="mx-auto max-w-2xl px-6 py-16"><section className="rounded-2xl border bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Paid Mock Test</p><h1 className="mt-2 text-3xl font-bold">{mockTest.title}</h1><p className="mt-4 text-gray-600">This Mock Test costs ₹{mockTest.price_inr}. Online purchase will be available here soon.</p><Link href="/mock-tests" className="mt-6 inline-flex rounded-lg bg-black px-5 py-3 font-medium text-white">Back to Mock Tests</Link></section></main>;
  }

  const { data, error } = await supabase.rpc("get_mock_test_attempt_payload", {
    requested_mock_test_id: id,
  });

  const questions = (data ?? []) as TestQuestion[];
  if (error || questions.length === 0) notFound();

  return <StudentTestRunner title={mockTest.title} mockTestId={mockTest.id} durationMinutes={mockTest.duration_minutes} questions={questions} />;
}
