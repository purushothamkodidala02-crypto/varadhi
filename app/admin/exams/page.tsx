import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Exam } from "@/types/exam";
import { CreateExamForm } from "./CreateExamForm";
import { DeleteExamButton } from "./DeleteExamButton";

export default async function AdminExamsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exams")
    .select(
      "id, name, slug, description, is_active, display_order, created_at, updated_at"
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const exams = (data ?? []) as Exam[];

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">Exams</h1>

        <p className="mt-2 text-gray-600">
          Create and manage exams available on Varadhi.
        </p>
      </div>

      <CreateExamForm />

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">
            Unable to load exams
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error.message}
          </p>
        </div>
      )}

      {!error && exams.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-lg font-semibold">
            No exams added yet
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Your first exam will be TGPSC.
          </p>
        </div>
      )}

      {!error && exams.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Existing Exams
          </h2>

          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-left">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold">
                    Name
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
                {exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="border-b last:border-b-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {exam.name}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {exam.slug}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={
                          exam.is_active
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                        }
                      >
                        {exam.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {exam.display_order}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/admin/exams/${exam.id}/edit`}
                          className="inline-flex h-6 items-center text-sm font-medium leading-none text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>

                        <DeleteExamButton
                          examId={exam.id}
                          examName={exam.name}
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