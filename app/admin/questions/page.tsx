import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/types/question";
import { CreateQuestionForm } from "./CreateQuestionForm";
import { DeleteQuestionButton } from "./DeleteQuestionButton";

type SubjectRecord = {
  id: string;
  exam_group_id: string;
  name: string;
  display_order: number;
};

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

export default async function AdminQuestionsPage() {
  const supabase = await createClient();

  const [
    questionsResult,
    subjectsResult,
    groupsResult,
    examsResult,
  ] = await Promise.all([
    supabase
      .from("questions")
      .select(
        "id, subject_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, image_url, source_reference, is_active, created_at, updated_at"
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("subjects")
      .select(
        "id, exam_group_id, name, display_order"
      )
      .order("display_order", { ascending: true }),

    supabase
      .from("exam_groups")
      .select("id, exam_id, name, display_order")
      .order("display_order", { ascending: true }),

    supabase
      .from("exams")
      .select("id, name"),
  ]);

  const questions = (questionsResult.data ??
    []) as Question[];

  const subjects = (subjectsResult.data ??
    []) as SubjectRecord[];

  const groups = (groupsResult.data ??
    []) as GroupRecord[];

  const exams = (examsResult.data ??
    []) as ExamRecord[];

  const subjectMap = new Map(
    subjects.map((subject) => [subject.id, subject])
  );

  const groupMap = new Map(
    groups.map((group) => [group.id, group])
  );

  const examMap = new Map(
    exams.map((exam) => [exam.id, exam])
  );

  const subjectOptions = subjects
    .map((subject) => {
      const group = groupMap.get(
        subject.exam_group_id
      );

      const exam = group
        ? examMap.get(group.exam_id)
        : undefined;

      return {
        id: subject.id,
        groupOrder: group?.display_order ?? 999,
        subjectOrder: subject.display_order,
        label: `${exam?.name ?? "Unknown"} — ${
          group?.name ?? "Unknown"
        } — ${subject.name}`,
      };
    })
    .sort(
      (first, second) =>
        first.groupOrder - second.groupOrder ||
        first.subjectOrder - second.subjectOrder ||
        first.label.localeCompare(second.label)
    )
    .map(({ id, label }) => ({
      id,
      label,
    }));

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Question Bank
        </h1>

        <p className="mt-2 text-gray-600">
          Create reusable questions and connect them to Mock
          Tests.
        </p>
      </div>

      <CreateQuestionForm subjects={subjectOptions} />

      {questionsResult.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">
            Unable to load Questions
          </p>

          <p className="mt-1 text-sm text-red-600">
            {questionsResult.error.message}
          </p>
        </div>
      )}

      {!questionsResult.error &&
        questions.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed p-8 text-center">
            <h2 className="text-lg font-semibold">
              No Questions added yet
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Start with a Current Affairs question for
              TGPSC Group I.
            </p>
          </div>
        )}

      {!questionsResult.error &&
        questions.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              Existing Questions
            </h2>

            <div className="mt-4 overflow-x-auto rounded-xl border">
              <table className="w-full text-left">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold">
                      Exam Entry
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Subject
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Question
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Answer
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {questions.map((question) => {
                    const subject = question.subject_id
                      ? subjectMap.get(question.subject_id)
                      : undefined;

                    const group = subject
                      ? groupMap.get(
                          subject.exam_group_id
                        )
                      : undefined;

                    const exam = group
                      ? examMap.get(group.exam_id)
                      : undefined;

                    return (
                      <tr
                        key={question.id}
                        className="border-b last:border-b-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {exam?.name ?? "Unknown"} —{" "}
                          {group?.name ?? "General"}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {subject?.name ?? "General"}
                        </td>

                        <td className="max-w-xl px-4 py-3">
                          <p className="line-clamp-2">
                            {question.question_text}
                          </p>
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          {question.correct_answer}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={
                              question.is_active
                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                                : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                            }
                          >
                            {question.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-4">
                            <Link
                              href={`/admin/questions/${question.id}/edit`}
                              className="text-sm font-medium text-gray-700 hover:underline"
                            >
                              Edit
                            </Link>

                            <DeleteQuestionButton
                              questionId={question.id}
                              questionText={question.question_text}
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
