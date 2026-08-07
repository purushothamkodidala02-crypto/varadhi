import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type {
  ExamGroupWithExam,
  ExamType,
} from "@/types/group";
import { CreateGroupForm } from "./CreateGroupForm";
import { DeleteGroupButton } from "./DeleteGroupButton";

const examTypeLabels: Record<ExamType, string> = {
  group: "Group Exam",
  gazetted: "Gazetted",
  non_gazetted: "Non-Gazetted",
  other: "Other",
};

const examTypeOrder: Record<ExamType, number> = {
  group: 1,
  gazetted: 2,
  non_gazetted: 3,
  other: 4,
};

export default async function AdminGroupsPage() {
  const supabase = await createClient();

  const [groupsResult, examsResult] = await Promise.all([
    supabase
      .from("exam_groups")
      .select(
        `
          id,
          exam_id,
          exam_type,
          name,
          slug,
          description,
          is_active,
          display_order,
          created_at,
          updated_at,
          exams (
            name
          )
        `
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),

    supabase
      .from("exams")
      .select("id, name")
      .order("display_order", { ascending: true }),
  ]);

  const groups = (groupsResult.data ??
    []) as unknown as ExamGroupWithExam[];

  const sortedGroups = [...groups].sort((a, b) => {
    return (
      examTypeOrder[a.exam_type] -
        examTypeOrder[b.exam_type] ||
      a.display_order - b.display_order ||
      a.name.localeCompare(b.name)
    );
  });

  const exams = examsResult.data ?? [];

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Exam Entries
        </h1>

        <p className="mt-2 text-gray-600">
          Manage Group, Gazetted, Non-Gazetted and other
          TGPSC exams.
        </p>
      </div>

      <CreateGroupForm exams={exams} />

      {groupsResult.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">
            Unable to load Exam Entries
          </p>

          <p className="mt-1 text-sm text-red-600">
            {groupsResult.error.message}
          </p>
        </div>
      )}

      {!groupsResult.error && sortedGroups.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-lg font-semibold">
            No Exam Entries added yet
          </h2>
        </div>
      )}

      {!groupsResult.error && sortedGroups.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Existing Exam Entries
          </h2>

          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-left">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold">
                    Exam
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Type
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold">
                    Entry
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
                {sortedGroups.map((group) => (
                  <tr
                    key={group.id}
                    className="border-b last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {group.exams?.name ?? "Unknown exam"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {examTypeLabels[group.exam_type]}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {group.name}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {group.slug}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={
                          group.is_active
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                        }
                      >
                        {group.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {group.display_order}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/admin/groups/${group.id}/edit`}
                          className="inline-flex h-6 items-center text-sm font-medium leading-none text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>

                        <DeleteGroupButton
                          groupId={group.id}
                          groupName={group.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}