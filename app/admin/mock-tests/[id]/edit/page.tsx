import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MockTest } from "@/types/mock-test";
import { EditMockTestForm } from "./EditMockTestForm";
import { QuestionAssignments } from "./QuestionAssignments";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditMockTestPage({
  params,
}: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    mockTestResult,
    groupsResult,
    examsResult,
    subjectsResult,
    questionsResult,
    assignmentsResult,
  ] = await Promise.all([
    supabase
      .from("mock_tests")
      .select(
        "id, exam_group_id, subject_id, title, slug, description, instructions, duration_minutes, difficulty, status, version, display_order, published_at, access_type, price_inr, created_at, updated_at"
      )
      .eq("id", id)
      .single(),

    supabase
      .from("exam_groups")
      .select("id, exam_id, name, display_order")
      .order("display_order", { ascending: true }),

    supabase.from("exams").select("id, name"),

    supabase
      .from("subjects")
      .select("id, exam_group_id, name, display_order")
      .order("display_order", { ascending: true }),

    supabase
      .from("questions")
      .select("id, subject_id, question_text, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("mock_test_questions")
      .select("id, question_id, question_order, marks, negative_marks")
      .eq("mock_test_id", id)
      .order("question_order", { ascending: true }),
  ]);

  if (mockTestResult.error || !mockTestResult.data) {
    notFound();
  }

  const mockTest = mockTestResult.data as MockTest;
  const groups = groupsResult.data ?? [];
  const exams = examsResult.data ?? [];
  const subjects = subjectsResult.data ?? [];

  const examMap = new Map(
    exams.map((exam) => [exam.id, exam])
  );

  const groupOptions = groups.map((group) => ({
    id: group.id,
    label: `${examMap.get(group.exam_id)?.name ?? "Unknown exam"} — ${group.name}`,
  }));

  const subjectOptions = subjects.map((subject) => ({
    id: subject.id,
    examGroupId: subject.exam_group_id,
    name: subject.name,
  }));

  const questionMap = new Map(
    (questionsResult.data ?? []).map((question) => [
      question.id,
      question,
    ])
  );

  const assignments = (assignmentsResult.data ?? []).map(
    (assignment) => ({
      ...assignment,
      question_text:
        questionMap.get(assignment.question_id)?.question_text ??
        "Question unavailable",
    })
  );

  const assignedQuestionIds = new Set(
    assignments.map((assignment) => assignment.question_id)
  );

  const availableQuestions = (questionsResult.data ?? [])
    .filter(
      (question) =>
        !assignedQuestionIds.has(question.id) &&
        (!mockTest.subject_id || question.subject_id === mockTest.subject_id)
    )
    .map((question) => ({
      id: question.id,
      text: question.question_text,
    }));

  return (
    <main>
      <Link
        href="/admin/mock-tests"
        className="text-sm font-medium text-gray-600 hover:text-black"
      >
        ← Back to Mock Tests
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold">
          Edit Mock Test
        </h1>

        <p className="mt-2 text-gray-600">
          Draft tests can be edited. Publishing locks the
          current version.
        </p>
      </div>

      <EditMockTestForm
        mockTest={mockTest}
        groups={groupOptions}
        subjects={subjectOptions}
      />

      <QuestionAssignments
        mockTestId={mockTest.id}
        isDraft={mockTest.status === "draft"}
        availableQuestions={availableQuestions}
        assignedQuestions={assignments}
      />
    </main>
  );
}
