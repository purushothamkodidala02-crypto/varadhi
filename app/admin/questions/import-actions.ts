"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
function lifecycleValue(value: string): QuestionLifecycle | null {
  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (["", "permanent", "evergreen"].includes(normalized)) return "permanent";
  if (["review", "time-sensitive", "current-affairs"].includes(normalized)) return "review";
  if (["expires", "expire", "expiry"].includes(normalized)) return "expires";
  return null;
}
const optionalNumber = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : Number.NaN;
};

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

  const headers = rows.shift()!.map((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw new Error("Each CSV column heading must be unique.");
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) throw new Error(`Missing CSV column${missingHeaders.length === 1 ? "" : "s"}: ${missingHeaders.join(", ")}.`);

  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()])));
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

  let categoryId = String(formData.get("import_exam_id") ?? "").trim();
  let examId = String(formData.get("import_exam_group_id") ?? "").trim();
  let paperId = String(formData.get("import_paper_id") ?? "").trim();
  const file = formData.get("questions_csv");
  let mockTest: MockImportTarget | null = null;
  if (mockTestId) {
    const { data } = await supabase
      .from("mock_tests")
      .select("id, paper_id, subject_id, test_scope, status")
      .eq("id", mockTestId)
      .maybeSingle();
    mockTest = data as MockImportTarget | null;
    if (!mockTest) return { success: false, message: "Mock Test not found." };
    if (mockTest.status !== "draft") return { success: false, message: "Only draft Mock Tests can receive a CSV import." };
    paperId = mockTest.paper_id;
  } else if (!categoryId || !examId || !paperId) {
    return { success: false, message: "Choose an Exam Category, Exam, and Paper before importing." };
  }
  if (!(file instanceof File) || !file.size) return { success: false, message: "Choose a CSV file to import." };
  if (file.size > 2_500_000) return { success: false, message: "This CSV is too large. Import up to 2.5 MB at a time." };

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
    rows = parseCsv(await file.text());
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "The CSV could not be read." };
  }
  if (rows.length > 500) return { success: false, message: "Import up to 500 Questions at one time." };

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, name, content_language_mode")
    .eq("paper_id", paperId);
  if (subjectsError) return { success: false, message: subjectsError.message };
  const subjectByName = new Map((subjects ?? []).map((subject) => [subject.name.trim().toLocaleLowerCase(), subject]));
  const importKeys = new Set<string>();
  const errors: string[] = [];
  const importRows: Record<string, unknown>[] = [];
  const assignmentPreferences: Array<{ key: string; rowNumber: number; questionOrder: number | null; marks: number | null; negativeMarks: number | null }> = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const importKey = (row.import_key ?? "").trim().toLocaleLowerCase();
    const subject = subjectByName.get((row.subject ?? "").trim().toLocaleLowerCase());
    const correctAnswer = (row.correct_answer ?? "").trim().toUpperCase() as CorrectAnswer;
    const lifecycle = lifecycleValue(row.content_lifecycle ?? "");
    const reviewOn = (row.review_on ?? "").trim();
    const expiresOn = (row.expires_on ?? "").trim();
    const sourceExamDate = (row.source_exam_date ?? "").trim();
    const isActive = activeValue(row.is_active ?? "");
    const english = languageValues(row, "en");
    const telugu = languageValues(row, "te");
    const questionOrder = optionalNumber(row.question_order ?? "");
    const marks = optionalNumber(row.marks ?? "");
    const negativeMarks = optionalNumber(row.negative_marks ?? "");

    if (!importKey) errors.push(`Row ${rowNumber}: import_key is required.`);
    if (!subject) errors.push(`Row ${rowNumber}: Subject "${row.subject || "(blank)"}" does not exist in the chosen Paper.`);
    if (subject && importKeys.has(`${subject.id}:${importKey}`)) errors.push(`Row ${rowNumber}: import_key "${importKey}" is repeated for ${subject.name}.`);
    if (subject && importKey) importKeys.add(`${subject.id}:${importKey}`);
    if (!answers.includes(correctAnswer)) errors.push(`Row ${rowNumber}: correct_answer must be A, B, C, or D.`);
    if (!lifecycle || (lifecycle === "review" && !validDate(reviewOn)) || (lifecycle === "expires" && !validDate(expiresOn))) errors.push(`Row ${rowNumber}: use permanent, time_sensitive, review, or expires and provide its required date.`);
    if (sourceExamDate && !validDate(sourceExamDate)) errors.push(`Row ${rowNumber}: source_exam_date must use YYYY-MM-DD.`);
    if (isActive === null) errors.push(`Row ${rowNumber}: is_active must be true or false.`);
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
    if (!subject || !importKey || !answers.includes(correctAnswer) || !lifecycle || isActive === null || (mockTest?.test_scope === "subject" && subject.id !== mockTest.subject_id)) return;
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

  const subjectIds = [...new Set(importRows.map((row) => String(row.subject_id)))];
  const keys = [...new Set(importRows.map((row) => String(row.import_key)))];
  const { data: existing, error: existingError } = await supabase
    .from("questions")
    .select("id, subject_id, import_key")
    .in("subject_id", subjectIds)
    .in("import_key", keys);
  if (existingError) return { success: false, message: existingError.message };
  const existingKeys = new Set((existing ?? []).map((question) => `${question.subject_id}:${question.import_key}`));
  const existingQuestionByKey = new Map((existing ?? []).map((question) => [`${question.subject_id}:${question.import_key}`, question.id]));

  let existingAssignments: Array<{ question_id: string; question_order: number }> = [];
  if (mockTest) {
    const { data, error: assignmentsError } = await supabase
      .from("mock_test_questions")
      .select("question_id, question_order")
      .eq("mock_test_id", mockTest.id);
    if (assignmentsError) return { success: false, message: assignmentsError.message };
    existingAssignments = data ?? [];
    const assignedQuestionIds = new Set(existingAssignments.map((assignment) => assignment.question_id));
    const occupiedOrders = new Set(existingAssignments.map((assignment) => assignment.question_order));
    const explicitOrders = new Set<number>();
    for (const preference of assignmentPreferences) {
      const existingQuestionId = existingQuestionByKey.get(preference.key);
      if (existingQuestionId && assignedQuestionIds.has(existingQuestionId)) continue;
      if (preference.questionOrder === null) continue;
      if (explicitOrders.has(preference.questionOrder) || occupiedOrders.has(preference.questionOrder)) {
        return { success: false, message: `Nothing was imported. Question order ${preference.questionOrder} is already used in this draft Mock Test.` };
      }
      explicitOrders.add(preference.questionOrder);
    }
  }

  const { data: savedQuestions, error } = await supabase
    .from("questions")
    .upsert(importRows, { onConflict: "subject_id,import_key" })
    .select("id, subject_id, import_key");
  if (error) return { success: false, message: error.message };

  let assigned = 0;
  let alreadyAssigned = 0;
  if (mockTest) {
    const savedQuestionByKey = new Map((savedQuestions ?? []).map((question) => [`${question.subject_id}:${question.import_key}`, question.id]));
    const assignedQuestionIds = new Set(existingAssignments.map((assignment) => assignment.question_id));
    const occupiedOrders = new Set(existingAssignments.map((assignment) => assignment.question_order));
    const explicitOrders = new Set(assignmentPreferences.map((preference) => preference.questionOrder).filter((order): order is number => order !== null));
    let nextOrder = Math.max(0, ...existingAssignments.map((assignment) => assignment.question_order)) + 1;
    const assignmentRows: Array<{ mock_test_id: string; question_id: string; question_order: number; marks: number; negative_marks: number }> = [];

    for (const preference of assignmentPreferences) {
      const questionId = savedQuestionByKey.get(preference.key);
      if (!questionId) continue;
      if (assignedQuestionIds.has(questionId)) {
        alreadyAssigned += 1;
        continue;
      }
      let order = preference.questionOrder;
      if (order === null) {
        while (occupiedOrders.has(nextOrder) || explicitOrders.has(nextOrder)) nextOrder += 1;
        order = nextOrder;
        nextOrder += 1;
      }
      occupiedOrders.add(order);
      assignmentRows.push({
        mock_test_id: mockTest.id,
        question_id: questionId,
        question_order: order,
        marks: preference.marks ?? paper.default_correct_marks ?? 1,
        negative_marks: preference.negativeMarks ?? paper.default_negative_marks ?? 0,
      });
    }
    if (assignmentRows.length) {
      const { error: assignmentError } = await supabase.from("mock_test_questions").insert(assignmentRows);
      if (assignmentError) return { success: false, message: `Questions were saved in the Question Bank, but could not be added to this Mock Test: ${assignmentError.message}` };
      assigned = assignmentRows.length;
    }
  }

  const updated = importRows.filter((row) => existingKeys.has(`${row.subject_id}:${row.import_key}`)).length;
  const added = importRows.length - updated;
  revalidatePath("/admin/questions");
  revalidatePath("/admin/mock-tests");
  if (mockTest) {
    revalidatePath(`/admin/mock-tests/${mockTest.id}/edit`);
    return { success: true, message: `${added} Question${added === 1 ? "" : "s"} added, ${updated} updated, and ${assigned} assigned to this Mock Test from ${file.name}.${alreadyAssigned ? ` ${alreadyAssigned} already assigned Question${alreadyAssigned === 1 ? " was" : "s were"} kept.` : ""}` };
  }
  return { success: true, message: `${added} Question${added === 1 ? "" : "s"} added and ${updated} updated from ${file.name}.` };
}
