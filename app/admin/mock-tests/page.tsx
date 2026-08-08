import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MockTest } from "@/types/mock-test";
import { CreateMockTestForm } from "./CreateMockTestForm";
import { MockTestManagementButtons } from "./MockTestManagementButtons";

type GroupRecord = {
  id: string;
  exam_id: string;
  name: string;
  display_order: number;
};

type ExamRecord = {
  id: string;
  name: string;
};

type SubjectRecord = {
  id: string;
  exam_group_id: string;
  name: string;
  display_order: number;
};

export default async function AdminMockTestsPage() {
  const supabase = await createClient();

  const [
    mockTestsResult,
    groupsResult,
    examsResult,
    subjectsResult,
  ] = await Promise.all([
    supabase
      .from("mock_tests")
      .select(
        "id, exam_group_id, subject_id, title, slug, description, instructions, duration_minutes, difficulty, status, version, display_order, published_at, access_type, price_inr, created_at, updated_at"
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),

    supabase
      .from("exam_groups")
      .select("id, exam_id, name, display_order")
      .order("display_order", { ascending: true }),

    supabase
      .from("exams")
      .select("id, name"),

    supabase
      .from("subjects")
      .select(
        "id, exam_group_id, name, display_order"
      )
      .order("display_order", { ascending: true }),
  ]);

  const mockTests = (mockTestsResult.data ??
    []) as MockTest[];

  const groups = (groupsResult.data ??
    []) as GroupRecord[];

  const exams = (examsResult.data ??
    []) as ExamRecord[];

  const subjects = (subjectsResult.data ??
    []) as SubjectRecord[];

  const groupMap = new Map(
    groups.map((group) => [group.id, group])
  );

  const examMap = new Map(
    exams.map((exam) => [exam.id, exam])
  );

  const subjectMap = new Map(
    subjects.map((subject) => [subject.id, subject])
  );

  const groupOptions = groups.map((group) => ({
    id: group.id,
    label: `${
      examMap.get(group.exam_id)?.name ?? "Unknown exam"
    } — ${group.name}`,
  }));

  const subjectOptions = subjects.map((subject) => ({
    id: subject.id,
    examGroupId: subject.exam_group_id,
    name: subject.name,
  }));

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Mock Tests
        </h1>

        <p className="mt-2 text-gray-600">
          Create and manage mock tests for every exam and
          Subject.
        </p>
      </div>

      <CreateMockTestForm
        groups={groupOptions}
        subjects={subjectOptions}
      />

      {mockTestsResult.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">
            Unable to load Mock Tests
          </p>

          <p className="mt-1 text-sm text-red-600">
            {mockTestsResult.error.message}
          </p>
        </div>
      )}

      {!mockTestsResult.error &&
        mockTests.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed p-8 text-center">
            <h2 className="text-lg font-semibold">
              No Mock Tests added yet
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Start with a Current Affairs test under TGPSC
              Group I.
            </p>
          </div>
        )}

      {!mockTestsResult.error &&
        mockTests.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              Existing Mock Tests
            </h2>

            <div className="mt-4 overflow-x-auto rounded-xl border">
              <table className="w-full text-left">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold">
                      Exam
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Entry
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Subject
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Mock Test
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Duration
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">Access</th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Version
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {mockTests.map((mockTest) => {
                    const group = groupMap.get(
                      mockTest.exam_group_id
                    );

                    const exam = group
                      ? examMap.get(group.exam_id)
                      : undefined;

                    const subject = mockTest.subject_id
                      ? subjectMap.get(mockTest.subject_id)
                      : undefined;

                    return (
                      <tr
                        key={mockTest.id}
                        className="border-b last:border-b-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {exam?.name ?? "Unknown exam"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {group?.name ?? "Unknown entry"}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {subject?.name ?? "General"}
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {mockTest.title}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {mockTest.duration_minutes} min
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={
                              mockTest.status === "published"
                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                                : mockTest.status === "archived"
                                  ? "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                                  : "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700"
                            }
                          >
                            {mockTest.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm font-medium">{mockTest.access_type === "paid" ? `Paid · ₹${mockTest.price_inr}` : "Free"}</td>

                        <td className="px-4 py-3 text-sm">
                          v{mockTest.version}
                        </td>
                        <td className="px-4 py-3">
                            
                            <div className="flex items-center gap-2">
                              <Link
                                  href={`/admin/mock-tests/${mockTest.id}/edit`}
                                  className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
                              >
                                  {mockTest.status === "draft" ? "Edit" : "View"}
                              </Link>
                              <MockTestManagementButtons
                                mockTestId={mockTest.id}
                                mockTestTitle={mockTest.title}
                                status={mockTest.status}
                              />
                            </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
    </main>
  );
}
