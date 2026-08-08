import { createClient } from "@/lib/supabase/server";
import { CreateQuestionForm } from "./CreateQuestionForm";
import { QuestionBankTable, type QuestionBankRow } from "./QuestionBankTable";

export default async function QuestionsPage() {
  const supabase = await createClient();
  const [questionsResult, subjectsResult, papersResult, groupsResult, categoriesResult] =
    await Promise.all([
      supabase
        .from("questions")
        .select(
          "id, subject_id, question_text, correct_answer, is_active, content_lifecycle, review_on, expires_on",
        )
        .order("created_at", { ascending: false }),
      supabase.from("subjects").select("id, paper_id, name, display_order").order("display_order"),
      supabase.from("papers").select("id, exam_group_id, name, display_order").order("display_order"),
      supabase
        .from("exam_groups")
        .select("id, exam_id, name, display_order")
        .order("display_order"),
      supabase.from("exams").select("id, name, display_order").order("display_order"),
    ]);

  const subjects = subjectsResult.data ?? [];
  const papers = papersResult.data ?? [];
  const exams = groupsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const paperById = new Map(papers.map((paper) => [paper.id, paper]));
  const examById = new Map(exams.map((exam) => [exam.id, exam]));

  const rows: QuestionBankRow[] = (questionsResult.data ?? []).map((question) => {
    const subject = subjectById.get(question.subject_id);
    const paper = subject ? paperById.get(subject.paper_id) : undefined;
    const exam = paper ? examById.get(paper.exam_group_id) : undefined;

    return {
      id: question.id,
      questionText: question.question_text,
      correctAnswer: question.correct_answer,
      isActive: question.is_active,
      contentLifecycle: question.content_lifecycle,
      reviewOn: question.review_on,
      expiresOn: question.expires_on,
      categoryId: exam?.exam_id ?? "",
      examId: exam?.id ?? "",
      paperId: paper?.id ?? "",
      subjectId: subject?.id ?? "",
      examName: exam?.name ?? "Unknown Exam",
      paperName: paper?.name ?? "Unknown Paper",
      subjectName: subject?.name ?? "Unknown Subject",
    };
  });

  return (
    <main>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
          Content library
        </p>
        <h1 className="mt-2 text-3xl font-black">Question Bank</h1>
        <p className="mt-2 text-slate-600">
          Questions are stored once under a Paper and Subject, then reused in
          paper-wise or subject-wise mocks.
        </p>
      </div>

      <CreateQuestionForm
        categories={categories.map((item) => ({ id: item.id, name: item.name }))}
        exams={exams.map((item) => ({
          id: item.id,
          categoryId: item.exam_id,
          name: item.name,
        }))}
        papers={papers.map((item) => ({
          id: item.id,
          examId: item.exam_group_id,
          name: item.name,
        }))}
        subjects={subjects.map((item) => ({
          id: item.id,
          paperId: item.paper_id,
          name: item.name,
        }))}
      />
      <QuestionBankTable
        categories={categories.map((item) => ({ id: item.id, name: item.name }))}
        exams={exams.map((item) => ({
          id: item.id,
          categoryId: item.exam_id,
          name: item.name,
        }))}
        papers={papers.map((item) => ({
          id: item.id,
          examId: item.exam_group_id,
          name: item.name,
        }))}
        subjects={subjects.map((item) => ({
          id: item.id,
          paperId: item.paper_id,
          name: item.name,
        }))}
        questions={rows}
      />
    </main>
  );
}
