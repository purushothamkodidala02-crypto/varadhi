import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    examsResult,
    mockTestsResult,
    questionsResult,
  ] = await Promise.all([
    supabase
      .from("exams")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("mock_tests")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("questions")
      .select("id", {
        count: "exact",
        head: true,
      }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <p className="mt-2 text-gray-600">
        Manage exams, subjects, mock tests and questions.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Exams
          </p>

          <p className="mt-2 text-3xl font-bold">
            {examsResult.count ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Mock Tests
          </p>

          <p className="mt-2 text-3xl font-bold">
            {mockTestsResult.count ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Questions
          </p>

          <p className="mt-2 text-3xl font-bold">
            {questionsResult.count ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Users
          </p>

          <p className="mt-2 text-3xl font-bold">
            0
          </p>
        </div>
      </div>
    </div>
  );
}