import ExcelJS from "exceljs";
import { QUESTION_IMPORT_EXPORT_HEADERS } from "@/lib/questions/import-format";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ExportQuestion = {
  id: string;
  subject_id: string;
  import_key: string | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  question_text_te: string | null;
  option_a_te: string | null;
  option_b_te: string | null;
  option_c_te: string | null;
  option_d_te: string | null;
  correct_answer: string;
  explanation: string | null;
  explanation_te: string | null;
  image_url: string | null;
  source_reference: string | null;
  source_exam_date: string | null;
  difficulty: string;
  is_active: boolean;
  content_lifecycle: string;
  review_on: string | null;
  expires_on: string | null;
};

type ExportSubject = {
  id: string;
  name: string;
  content_language_mode: "bilingual" | "english" | "telugu";
};

function safeFilename(value: string) {
  const normalized = value.normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.slice(0, 80) || "mock-test";
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("You must be logged in.", { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return new Response("You are not authorized to export Questions.", { status: 403 });

  const [{ data: mockTest }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase.from("mock_tests").select("id, title").eq("id", id).maybeSingle(),
    supabase.from("mock_test_questions").select("question_id, question_order, marks, negative_marks").eq("mock_test_id", id).order("question_order"),
  ]);
  if (!mockTest) return new Response("Mock Test not found.", { status: 404 });
  if (assignmentsError) return new Response(assignmentsError.message, { status: 500 });

  const questionIds = (assignments ?? []).map((assignment) => assignment.question_id);
  let questions: ExportQuestion[] = [];
  let subjects: ExportSubject[] = [];
  if (questionIds.length) {
    const { data: questionRows, error: questionsError } = await supabase
      .from("questions")
      .select("id, subject_id, import_key, question_text, option_a, option_b, option_c, option_d, question_text_te, option_a_te, option_b_te, option_c_te, option_d_te, correct_answer, explanation, explanation_te, image_url, source_reference, source_exam_date, difficulty, is_active, content_lifecycle, review_on, expires_on")
      .in("id", questionIds);
    if (questionsError) return new Response(questionsError.message, { status: 500 });
    questions = (questionRows ?? []) as ExportQuestion[];

    const subjectIds = [...new Set(questions.map((question) => question.subject_id))];
    const { data: subjectRows, error: subjectsError } = await supabase
      .from("subjects")
      .select("id, name, content_language_mode")
      .in("id", subjectIds);
    if (subjectsError) return new Response(subjectsError.message, { status: 500 });
    subjects = (subjectRows ?? []) as ExportSubject[];
  }

  const questionById = new Map(questions.map((question) => [question.id, question]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Varadhi Prep";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Varadhi Import", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  worksheet.columns = QUESTION_IMPORT_EXPORT_HEADERS.map((header) => ({
    header,
    key: header,
    width: header.includes("question") || header.includes("explanation") ? 42 : header.includes("option") ? 28 : 18,
  }));

  for (const assignment of assignments ?? []) {
    const question = questionById.get(assignment.question_id);
    if (!question) continue;
    const subject = subjectById.get(question.subject_id);
    const teluguOnly = subject?.content_language_mode === "telugu";
    const englishOnly = subject?.content_language_mode === "english";
    worksheet.addRow({
      import_key: question.import_key || `question-${question.id}`,
      subject: subject?.name ?? "",
      question_en: teluguOnly ? "" : question.question_text,
      option_a_en: teluguOnly ? "" : question.option_a,
      option_b_en: teluguOnly ? "" : question.option_b,
      option_c_en: teluguOnly ? "" : question.option_c,
      option_d_en: teluguOnly ? "" : question.option_d,
      explanation_en: teluguOnly ? "" : question.explanation ?? "",
      question_te: englishOnly ? "" : question.question_text_te ?? question.question_text,
      option_a_te: englishOnly ? "" : question.option_a_te ?? question.option_a,
      option_b_te: englishOnly ? "" : question.option_b_te ?? question.option_b,
      option_c_te: englishOnly ? "" : question.option_c_te ?? question.option_c,
      option_d_te: englishOnly ? "" : question.option_d_te ?? question.option_d,
      explanation_te: englishOnly ? "" : question.explanation_te ?? question.explanation ?? "",
      correct_answer: question.correct_answer,
      image_url: question.image_url ?? "",
      source_reference: question.source_reference ?? "",
      source_exam_date: question.source_exam_date ?? "",
      difficulty: question.difficulty,
      is_active: question.is_active ? "true" : "false",
      content_lifecycle: question.content_lifecycle,
      review_on: question.review_on ?? "",
      expires_on: question.expires_on ?? "",
      question_order: assignment.question_order,
      marks: Number(assignment.marks),
      negative_marks: Number(assignment.negative_marks),
    });
  }

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.height = 32;
  worksheet.autoFilter = { from: "A1", to: `${worksheet.getColumn(QUESTION_IMPORT_EXPORT_HEADERS.length).letter}1` };
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
  });

  const contents = await workbook.xlsx.writeBuffer();
  const filename = `${safeFilename(mockTest.title)}-questions.xlsx`;
  return new Response(new Uint8Array(contents), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
