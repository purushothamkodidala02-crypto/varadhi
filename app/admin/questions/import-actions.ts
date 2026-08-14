"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { normalizeQuestionImageUrl } from "@/lib/questions/media";
import type { CorrectAnswer, QuestionLifecycle } from "@/types/question";
import type { SubjectContentLanguageMode } from "@/types/subject";

export type ImportQuestionsState = { success: boolean; message: string };

type CsvRow = Record<string, string>;
type QuestionLanguageValues = {
  question: string;
  options: [string, string, string, string];
  explanation: string | null;
};
type MockImportTarget = {
  id: string;
  paper_id: string;
  subject_id: string | null;
  test_scope: "paper" | "subject";
  status: string;
};

const requiredHeaders = [
  "import_key", "subject", "question_en", "option_a_en", "option_b_en", "option_c_en", "option_d_en",
  "question_te", "option_a_te", "option_b_te", "option_c_te", "option_d_te", "correct_answer",
];
const answers: CorrectAnswer[] = ["A", "B", "C", "D"];
const lifecycles: QuestionLifecycle[] = ["permanent", "review", "expires"];
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const optionalNumber = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : Number.NaN;
};

const cleanCellValue = (value: string) => value.replace(/\u00A0/g, " ").replace(/\r\n?/g, "\n").trim();
const normalizeHeader = (value: string) => cleanCellValue(value).replace(/^\uFEFF/, "").toLowerCase().replace(/[\s-]+/g, "_");
const normalizeLookup = (value: string) => cleanCellValue(value).replace(/\s+/g, " ").toLocaleLowerCase();

function validateHeaders(headers: string[]) {
  if (new Set(headers).size !== headers.length) throw new Error("Each file column heading must be unique.");
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) throw new Error(`Missing file column${missingHeaders.length === 1 ? "" : "s"}: ${missingHeaders.join(", ")}.`);
}

function parseCsv(source: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("The CSV has an unclosed quotation mark.");
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one Question.");

  const headers = rows.shift()!.map(normalizeHeader);
  validateHeaders(headers);

  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, cleanCellValue(values[index] ?? "")])));
}

async function parseExcel(file: File): Promise<CsvRow[]> {
  const workbook = new ExcelJS.Workbook();
  const fileBuffer = Buffer.from(await file.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0];
  await workbook.xlsx.load(fileBuffer);
  const worksheet = workbook.getWorksheet("Varadhi Import") ?? workbook.worksheets[0];
  if (!worksheet) throw new Error("The Excel file does not contain a worksheet.");

  const headers = Array.from({ length: worksheet.columnCount }, (_, index) => normalizeHeader(worksheet.getCell(1, index + 1).text));
  validateHeaders(headers);
  const rows: CsvRow[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const values = headers.map((header, index) => [header, cleanCellValue(worksheet.getCell(rowNumber, index + 1).text)] as const);
    if (values.some(([, value]) => value)) rows.push(Object.fromEntries(values));
  }
  if (!rows.length) throw new Error("The Excel sheet needs headings and at least one Question.");
  return rows;
}

async function parseQuestionFile(file: File): Promise<CsvRow[]> {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "xlsx") return parseExcel(file);
  if (extension === "csv") return parseCsv(await file.text());
  throw new Error("Choose an Excel (.xlsx) or CSV (.csv) file.");
}

function languageValues(row: CsvRow, suffix: "en" | "te"): QuestionLanguageValues {
  return {
    question: row[`question_${suffix}`] ?? "",
    options: ["a", "b", "c", "d"].map((letter) => row[`option_${letter}_${suffix}`] ?? "") as QuestionLanguageValues["options"],
    explanation: (row[`explanation_${suffix}`] ?? "").trim() || null,
  };
}

function validateLanguageValues(values: QuestionLanguageValues, language: string, rowNumber: number) {
  if (!values.question || values.options.some((option) => !option)) {
    return `Row ${rowNumber}: ${language} Question text and all four ${language} options are required.`;
  }
  if (new Set(values.options.map((option) => option.toLocaleLowerCase())).size !== 4) {
    return `Row ${rowNumber}: all four ${language} options must be different.`;
  }
  return null;
}

function activeValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["", "true", "yes", "1", "active"].includes(normalized)) return true;
  if (["false", "no", "0", "inactive"].includes(normalized)) return false;
  return null;
}

export async function importQuestionsFromCsv(
  _previous: ImportQuestionsState,
  formData: FormData,
): Promise<ImportQuestionsState> {
  return importQuestions(formData);
}

export async function importQuestionsIntoMockTest(
  mockTestId: string,
  _previous: ImportQuestionsState,
  formData: FormData,
): Promise<ImportQuestionsState> {
  return importQuestions(formData, mockTestId);
}

async function importQuestions(
  formData: FormData,
  mockTestId?: string,
): Promise<ImportQuestionsState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, message: "You are not authorized to import Questions." };

  const categoryId = String(formData.get("import_exam_id") ?? "").trim();
  const examId = String(formData.get("import_exam_group_id") ?? "").trim();
  let paperId = String(formData.get("import_paper_id") ?? "").trim();
  const file = formData.get("questions_file");
  let mockTest: MockImportTarget | null = null;
  if (mockTestId) {
    const { data } = await supabase
      .from("mock_tests")
      .select("id, paper_id, subject_id, test_scope, status")
      .eq("id", mockTestId)
      .maybeSingle();
    mockTest = data as MockImportTarget | null;
    if (!mockTest) return { success: false, message: "Mock Test not found." };
    if (mockTest.status !== "draft") return { success: false, message: "Only draft Mock Tests can receive a file import." };
    paperId = mockTest.paper_id;
  } else if (!categoryId || !examId || !paperId) {
    return { success: false, message: "Choose an Exam Category, Exam, and Paper before importing." };
  }
  if (!(file instanceof File) || !file.size) return { success: false, message: "Choose an Excel or CSV file to import." };
  if (file.size > 2_500_000) return { success: false, message: "This file is too large. Import up to 2.5 MB at a time." };

  const [{ data: paper }, { data: exam }] = await Promise.all([
    supabase.from("papers").select("id, exam_group_id, default_correct_marks, default_negative_marks").eq("id", paperId).maybeSingle(),
    mockTest
      ? Promise.resolve({ data: null })
      : supabase.from("exam_groups").select("id, exam_id").eq("id", examId).maybeSingle(),
  ]);
  if (!paper || (!mockTest && (!exam || paper.exam_group_id !== exam.id || exam.exam_id !== categoryId))) {
    return { success: false, message: "The selected Exam Category, Exam, and Paper do not belong together." };
  }

  let rows: CsvRow[];
  try {
    rows = await parseQuestionFile(file);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "The Question file could not be read." };
  }
  if (rows.length > 500) return { success: false, message: "Import up to 500 Questions at one time." };

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, name, content_language_mode")
    .eq("paper_id", paperId);
  if (subjectsError) return { success: false, message: subjectsError.message };
  const subjectByName = new Map((subjects ?? []).map((subject) => [normalizeLookup(subject.name), subject]));
  const importKeys = new Set<string>();
  const errors: string[] = [];
  const importRows: Record<string, unknown>[] = [];
  const assignmentPreferences: Array<{ key: string; rowNumber: number; questionOrder: number | null; marks: number | null; negativeMarks: number | null }> = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const importKey = (row.import_key ?? "").trim().toLocaleLowerCase();
    const subject = subjectByName.get(normalizeLookup(row.subject ?? ""));
    const correctAnswer = (row.correct_answer ?? "").trim().toUpperCase() as CorrectAnswer;
    const lifecycle = ((row.content_lifecycle ?? "permanent").trim().toLowerCase() || "permanent") as QuestionLifecycle;
    const reviewOn = (row.review_on ?? "").trim();
    const expiresOn = (row.expires_on ?? "").trim();
    const sourceExamDate = (row.source_exam_date ?? "").trim();
    const isActive = activeValue(row.is_active ?? "");
    const english = languageValues(row, "en");
    const telugu = languageValues(row, "te");
    const questionOrder = optionalNumber(row.question_order ?? "");
    const marks = optionalNumber(row.marks ?? "");
    const negativeMarks = optionalNumber(row.negative_marks ?? "");
    const image = normalizeQuestionImageUrl(row.image_url ?? "");

    if (!importKey) errors.push(`Row ${rowNumber}: import_key is required.`);
    if (!subject) errors.push(`Row ${rowNumber}: Subject "${row.subject || "(blank)"}" does not exist in the chosen Paper.`);
    if (subject && importKeys.has(`${subject.id}:${importKey}`)) errors.push(`Row ${rowNumber}: import_key "${importKey}" is repeated for ${subject.name}.`);
    if (subject && importKey) importKeys.add(`${subject.id}:${importKey}`);
    if (!answers.includes(correctAnswer)) errors.push(`Row ${rowNumber}: correct_answer must be A, B, C, or D.`);
    if (!lifecycles.includes(lifecycle) || (lifecycle === "review" && !validDate(reviewOn)) || (lifecycle === "expires" && !validDate(expiresOn))) errors.push(`Row ${rowNumber}: check content_lifecycle and its date.`);
    if (sourceExamDate && !validDate(sourceExamDate)) errors.push(`Row ${rowNumber}: source_exam_date must use YYYY-MM-DD.`);
    if (isActive === null) errors.push(`Row ${rowNumber}: is_active must be true or false.`);
    if (image.error) errors.push(`Row ${rowNumber}: ${image.error}`);
    if (mockTest && questionOrder !== null && (!Number.isInteger(questionOrder) || questionOrder < 1)) errors.push(`Row ${rowNumber}: question_order must be a whole number greater than zero.`);
    if (mockTest && marks !== null && (!Number.isFinite(marks) || marks <= 0)) errors.push(`Row ${rowNumber}: marks must be a number greater than zero.`);
    if (mockTest && negativeMarks !== null && (!Number.isFinite(negativeMarks) || negativeMarks < 0)) errors.push(`Row ${rowNumber}: negative_marks must be zero or a positive number.`);

    const languageMode = subject?.content_language_mode as SubjectContentLanguageMode | undefined;
    if (languageMode === "bilingual") {
      const englishError = validateLanguageValues(english, "English", rowNumber);
      const teluguError = validateLanguageValues(telugu, "Telugu", rowNumber);
      if (englishError) errors.push(englishError);
      if (teluguError) errors.push(teluguError);
    } else if (languageMode === "english") {
      const englishError = validateLanguageValues(english, "English", rowNumber);
      if (englishError) errors.push(englishError);
    } else if (languageMode === "telugu") {
      const teluguError = validateLanguageValues(telugu, "Telugu", rowNumber);
      if (teluguError) errors.push(teluguError);
    }

    if (mockTest?.test_scope === "subject" && subject && subject.id !== mockTest.subject_id) {
      errors.push(`Row ${rowNumber}: this subject-wise Mock Test only accepts Questions for its selected Subject.`);
    }
    if (!subject || !importKey || !answers.includes(correctAnswer) || !lifecycles.includes(lifecycle) || isActive === null || (mockTest?.test_scope === "subject" && subject.id !== mockTest.subject_id)) return;
    const canonical = languageMode === "telugu" ? telugu : english;
    importRows.push({
      subject_id: subject.id,
      import_key: importKey,
      question_text: canonical.question,
      question_type: "mcq",
      option_a: canonical.options[0],
      option_b: canonical.options[1],
      option_c: canonical.options[2],
      option_d: canonical.options[3],
      correct_answer: correctAnswer,
      explanation: canonical.explanation,
      question_text_te: languageMode === "english" ? null : telugu.question,
      option_a_te: languageMode === "english" ? null : telugu.options[0],
      option_b_te: languageMode === "english" ? null : telugu.options[1],
      option_c_te: languageMode === "english" ? null : telugu.options[2],
      option_d_te: languageMode === "english" ? null : telugu.options[3],
      explanation_te: languageMode === "english" ? null : telugu.explanation,
      image_url: image.url,
      source_reference: (row.source_reference ?? "").trim() || null,
      source_exam_date: sourceExamDate || null,
      difficulty: ["easy", "medium", "hard"].includes((row.difficulty ?? "").trim().toLowerCase()) ? (row.difficulty ?? "").trim().toLowerCase() : "medium",
      is_active: isActive,
      content_lifecycle: lifecycle,
      review_on: lifecycle === "review" ? reviewOn : null,
      expires_on: lifecycle === "expires" ? expiresOn : null,
    });
    assignmentPreferences.push({ key: `${subject.id}:${importKey}`, rowNumber, questionOrder, marks, negativeMarks });
  });

  if (errors.length) {
    const shownErrors = errors.slice(0, 6);
    return { success: false, message: `Nothing was imported. ${shownErrors.join(" ")}${errors.length > shownErrors.length ? ` Plus ${errors.length - shownErrors.length} more issue(s).` : ""}` };
  }

  const atomicAssignments = mockTest
    ? assignmentPreferences.map((preference) => {
        const separator = preference.key.indexOf(":");
        return {
          subject_id: preference.key.slice(0, separator),
          import_key: preference.key.slice(separator + 1),
          question_order: preference.questionOrder,
          marks: preference.marks ?? paper.default_correct_marks ?? 1,
          negative_marks: preference.negativeMarks ?? paper.default_negative_marks ?? 0,
        };
      })
    : [];
  const { data: importResult, error } = await supabase.rpc("import_questions_atomic", {
    requested_paper_id: paperId,
    requested_mock_test_id: mockTest?.id ?? null,
    requested_questions: importRows,
    requested_assignments: atomicAssignments,
  });
  if (error) {
    const orderConflict = error.code === "23505" && error.message.includes("question_order");
    return {
      success: false,
      message: orderConflict
        ? "Nothing was imported. One or more Question order numbers are already in use."
        : `Nothing was imported. ${error.message}`,
    };
  }
  const summary = importResult?.[0] ?? { added: 0, updated: 0, assigned: 0, already_assigned: 0 };
  const added = Number(summary.added);
  const updated = Number(summary.updated);
  const assigned = Number(summary.assigned);
  const alreadyAssigned = Number(summary.already_assigned);
  revalidatePath("/admin/questions");
  revalidatePath("/admin/mock-tests");
  if (mockTest) {
    revalidatePath(`/admin/mock-tests/${mockTest.id}/edit`);
    return { success: true, message: `${added} Question${added === 1 ? "" : "s"} added, ${updated} updated, and ${assigned} assigned to this Mock Test from ${file.name}.${alreadyAssigned ? ` ${alreadyAssigned} already assigned Question${alreadyAssigned === 1 ? " was" : "s were"} kept.` : ""}` };
  }
  return { success: true, message: `${added} Question${added === 1 ? "" : "s"} added and ${updated} updated from ${file.name}.` };
}
