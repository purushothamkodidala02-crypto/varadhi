import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicHeader } from "@/components/site/PublicHeader";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { absoluteUrl } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

type MockTestDetailsProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: MockTestDetailsProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: test } = await supabase
    .from("mock_tests")
    .select("id, paper_id, title, duration_minutes")
    .eq("id", id)
    .eq("status", "published")
    .eq("access_type", "free")
    .maybeSingle();

  if (!test) {
    return {
      title: "Mock Test Not Found",
      robots: { index: false, follow: false },
    };
  }

  const { data: paper } = await supabase
    .from("papers")
    .select("id, exam_group_id, specialization_id, name, display_order")
    .eq("id", test.paper_id)
    .maybeSingle();
  const { data: siblingPapers } = paper
    ? await supabase
        .from("papers")
        .select("id, exam_group_id, specialization_id, name, display_order")
        .eq("exam_group_id", paper.exam_group_id)
        .eq("is_active", true)
    : { data: [] };
  const paperDisplay = paper
    ? buildPaperDisplayMap((siblingPapers ?? []) as OrderedPaper[]).get(paper.id)
    : undefined;
  const paperLabel = paperDisplay?.shortLabel ?? "TGPSC";
  const title = `${test.title} ${paperLabel} Mock Test`;
  const description = `Take the free ${test.title} ${paperLabel} mock test${paper ? ` covering ${paper.name}` : ""}. ${test.duration_minutes}-minute timed TGPSC practice on Varadhi.`;

  return {
    title,
    description,
    alternates: { canonical: `/mock-tests/${id}` },
    openGraph: {
      title,
      description,
      url: `/mock-tests/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function MockTestDetailsPage({ params }: MockTestDetailsProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [testResult, authResult] = await Promise.all([
    supabase.from("mock_tests").select("id, paper_id, subject_id, test_scope, title, description, instructions, duration_minutes, status, access_type").eq("id", id).eq("status", "published").eq("access_type", "free").maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const test = testResult.data;
  if (!test) notFound();

  const [paperResult, subjectResult] = await Promise.all([
    supabase.from("papers").select("id, exam_group_id, specialization_id, name, display_order, question_count, default_correct_marks, default_negative_marks").eq("id", test.paper_id).maybeSingle(),
    test.subject_id ? supabase.from("subjects").select("id, name, content_language_mode").eq("id", test.subject_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const paper = paperResult.data;
  const [examResult, specializationResult, siblingPapersResult] = await Promise.all([
    paper ? supabase.from("exam_groups").select("id, exam_id, name").eq("id", paper.exam_group_id).maybeSingle() : Promise.resolve({ data: null }),
    paper?.specialization_id ? supabase.from("exam_specializations").select("id, name").eq("id", paper.specialization_id).maybeSingle() : Promise.resolve({ data: null }),
    paper ? supabase.from("papers").select("id, exam_group_id, specialization_id, name, display_order").eq("exam_group_id", paper.exam_group_id).eq("is_active", true) : Promise.resolve({ data: [] }),
  ]);
  const exam = examResult.data;
  const paperDisplay = paper
    ? buildPaperDisplayMap((siblingPapersResult.data ?? []) as OrderedPaper[]).get(paper.id)
    : undefined;
  const categoryResult = exam ? await supabase.from("exams").select("id, name").eq("id", exam.exam_id).maybeSingle() : { data: null };
  const configuredQuestionCount = Number(paper?.question_count ?? 0);
  const questionCount =
    test.test_scope === "paper" && configuredQuestionCount > 0
      ? configuredQuestionCount
      : null;
  const totalMarks = questionCount
    ? questionCount * Number(paper?.default_correct_marks ?? 0)
    : null;
  const negativeMarks = Number(paper?.default_negative_marks ?? 0);
  const questionCountLabel = questionCount ? String(questionCount) : "Shown when started";
  const totalMarksLabel = totalMarks
    ? totalMarks.toFixed(2).replace(/\.00$/, "")
    : "Shown when started";
  const languageMode = subjectResult.data?.content_language_mode ?? "bilingual";
  const languageLabel = languageMode === "bilingual" ? "English + Telugu" : languageMode === "telugu" ? "Telugu" : "English";
  const isLoggedIn = Boolean(authResult.data.user);
  const [resumableSessionResult, previousAttemptResult] = isLoggedIn && authResult.data.user
    ? await Promise.all([
        supabase
          .from("test_attempt_sessions")
          .select("id")
          .eq("user_id", authResult.data.user.id)
          .eq("mock_test_id", id)
          .is("submitted_at", null)
          .gt("remaining_seconds", 0)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("test_attempts")
          .select("id")
          .eq("user_id", authResult.data.user.id)
          .eq("mock_test_id", id)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];
  const hasResumableSession = Boolean(resumableSessionResult.data);
  const hasPreviousAttempt = Boolean(previousAttemptResult.data);
  const practiceButtonLabel = !isLoggedIn
    ? "Sign in to start"
    : hasResumableSession
      ? "Resume practice"
      : hasPreviousAttempt
        ? "Retake test"
        : "Start practice";
  const resourceName = `${test.title} ${paperDisplay?.shortLabel ?? "TGPSC"} Mock Test`;
  const resourceDescription =
    test.description ??
    `A free, timed ${resourceName} for focused competitive-exam preparation.`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Quiz",
      name: resourceName,
      description: resourceDescription,
      url: absoluteUrl(`/mock-tests/${id}`),
      isAccessibleForFree: true,
      educationalUse: "Practice",
      learningResourceType: "Mock test",
      timeRequired: `PT${test.duration_minutes}M`,
      inLanguage:
        languageMode === "bilingual"
          ? ["en-IN", "te-IN"]
          : languageMode === "telugu"
            ? "te-IN"
            : "en-IN",
      provider: {
        "@type": "Organization",
        name: "Varadhi",
        url: absoluteUrl("/"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Mock tests", item: absoluteUrl("/mock-tests") },
        { "@type": "ListItem", position: 3, name: resourceName, item: absoluteUrl(`/mock-tests/${id}`) },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <JsonLd data={jsonLd} />
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/mock-tests" className="text-sm font-bold text-teal-700 hover:text-teal-800">← Back to mock tests</Link>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <section>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Free</span><span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">{test.test_scope === "paper" ? "Full-length Paper test" : "Subject test"}</span></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">{categoryResult.data?.name ?? "TGPSC"} · {exam?.name ?? "Exam"}</p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">{test.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{test.description ?? "A focused Varadhi mock test designed to strengthen your exam preparation."}</p>
            <div className="mt-7 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">{specializationResult.data && <span className="rounded-lg border bg-white px-3 py-2">{specializationResult.data.name}</span>}<span className="rounded-lg border bg-white px-3 py-2">{paperDisplay?.label ?? paper?.name ?? "Paper"}</span>{subjectResult.data && <span className="rounded-lg border bg-white px-3 py-2">{subjectResult.data.name}</span>}</div>

            <section className="mt-10 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black">Before you begin</h2><p className="mt-2 text-sm leading-6 text-slate-600">Review the test rules now. The timer starts only after you select the start button.</p><div className="mt-7 grid gap-4 sm:grid-cols-2">{[["Questions", questionCountLabel], ["Duration", `${test.duration_minutes} minutes`], ["Total marks", totalMarksLabel], ["Negative marking", negativeMarks > 0 ? `Up to ${negativeMarks} per wrong answer` : "No negative marking"], ["Language", languageLabel], ["Progress", "Saved during the attempt"]].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 font-black text-slate-950">{value}</p></div>)}</div></section>

            <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black">Instructions</h2>{test.instructions ? <div className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">{test.instructions}</div> : <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700"><li className="flex gap-3"><span className="font-black text-teal-700">01</span>Answer each question before moving on, or return to it later during the attempt.</li><li className="flex gap-3"><span className="font-black text-teal-700">02</span>Your answers and remaining time are saved automatically.</li><li className="flex gap-3"><span className="font-black text-teal-700">03</span>Select Pause to stop the timer, then Resume whenever you are ready.</li><li className="flex gap-3"><span className="font-black text-teal-700">04</span>After submission, review your result or retake the test for more practice.</li></ul>}</section>
          </section>

          <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:sticky lg:top-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-200">Ready to practise?</p><h2 className="mt-3 text-2xl font-black">Practice at your pace.</h2><p className="mt-3 text-sm leading-6 text-slate-300">Pause when needed, resume with your saved time, and retake after submission.</p><div className="mt-6 space-y-3 border-y border-slate-700 py-5 text-sm"><p className="flex justify-between gap-3"><span className="text-slate-400">Questions</span><strong>{questionCount ?? "—"}</strong></p><p className="flex justify-between gap-3"><span className="text-slate-400">Duration</span><strong>{test.duration_minutes} min</strong></p><p className="flex justify-between gap-3"><span className="text-slate-400">Access</span><strong>Free</strong></p></div><Link href={`/mock-tests/${id}/attempt`} className="mt-6 block rounded-xl bg-teal-300 px-5 py-3.5 text-center font-black text-slate-950 hover:bg-teal-200">{practiceButtonLabel}</Link><p className="mt-4 text-center text-xs leading-5 text-slate-400">{!isLoggedIn ? "Sign in or create an account, then return directly to this test." : hasResumableSession ? "Continue with your saved answers and remaining time." : hasPreviousAttempt ? "A new attempt will start. Your earlier result remains saved." : "Your answers and remaining time will be saved automatically."}</p></aside>
        </div>
      </div>
    </main>
  );
}
