import { supabase } from "@/lib/supabase";

export default async function AdminDashboard() {
  const [
    { count: examsCount },
    { count: mockTestsCount },
    { count: questionsCount },
  ] = await Promise.all([
    supabase.from("exams").select("*", { count: "exact", head: true }),
    supabase.from("mock_tests").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <p className="mt-2 text-gray-600">
        Manage exams, subjects, mock tests and questions.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Exams</p>
          <p className="mt-2 text-3xl font-bold">
            {examsCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Mock Tests</p>
          <p className="mt-2 text-3xl font-bold">
            {mockTestsCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Questions</p>
          <p className="mt-2 text-3xl font-bold">
            {questionsCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Users</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}