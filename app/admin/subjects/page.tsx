import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Subject } from "@/types/subject";
import { CreateSubjectForm } from "./CreateSubjectForm";
import { DeleteSubjectButton } from "./DeleteSubjectButton";

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

export default async function AdminSubjectsPage() {
  const supabase = await createClient();

  const [subjectsResult, groupsResult, examsResult] =
    await Promise.all([
      supabase
        .from("subjects")
        .select(
          "id, exam_group_id, name, slug, description, is_active, display_order, created_at, updated_at"
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
    ]);

  const subjects = (subjectsResult.data ?? []) as Subject[];
  const groups = (groupsResult.data ?? []) as GroupRecord[];
  const exams = (examsResult.data ?? []) as ExamRecord[];

  const groupMap = new Map(
    groups.map((group) => [group.id, group])
  );

  const examMap = new Map(
    exams.map((exam) => [exam.id, exam])
  );

  const groupOptions = groups.map((group) => ({
    id: group.id,
    label: `${examMap.get(group.exam_id)?.name ?? "Unknown exam"} — ${group.name}`,
  }));

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">Subjects</h1>

        <p className="mt-2 text-gray-600">
          Create and manage Subjects under each TGPSC Group.
        </p>
      </div>

      <CreateSubjectForm groups={groupOptions} />

      {subjectsResult.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">
            Unable to load Subjects
          </p>

          <p className="mt-1 text-sm text-red-600">
            {subjectsResult.error.message}
          </p>
        </div>
      )}

      {!subjectsResult.error && subjects.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-lg font-semibold">
            No Subjects added yet
          </h2>
        </div>
      )}

      {!subjectsResult.error && subjects.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Existing Subjects
          </h2>

          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-left">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold">
                    Exam
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Group
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Subject
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Slug
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Order
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((subject) => {
                  const group = groupMap.get(
                    subject.exam_group_id
                  );

                  const exam = group
                    ? examMap.get(group.exam_id)
                    : undefined;

                  return (
                    <tr
                      key={subject.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sm">
                        {exam?.name ?? "Unknown exam"}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {group?.name ?? "Unknown group"}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {subject.name}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {subject.slug}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={
                            subject.is_active
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                              : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                          }
                        >
                          {subject.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {subject.display_order}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/admin/subjects/${subject.id}/edit`}
                            className="inline-flex h-6 items-center text-sm font-medium leading-none text-blue-600 hover:underline"
                          >
                            Edit
                          </Link>

                          <DeleteSubjectButton
                            subjectId={subject.id}
                            subjectName={subject.name}
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