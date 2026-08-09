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

const requiredHeaders = [
  "import_key", "subject", "question_en", "option_a_en", "option_b_en", "option_c_en", "option_d_en",
  "question_te", "option_a_te", "option_b_te", "option_c_te", "option_d_te", "correct_answer",
];
const answers: CorrectAnswer[] = ["A", "B", "C", "D"];
const lifecycles: QuestionLifecycle[] = ["permanent", "review", "expires"];
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, message: "You are not authorized to import Questions." };

  const categoryId = String(formData.get("import_exam_id") ?? "").trim();
  const examId = String(formData.get("import_exam_group_id") ?? "").trim();
  const paperId = String(formData.get("import_paper_id") ?? "").trim();
  const file = formData.get("questions_csv");
  if (!categoryId || !examId || !paperId) return { success: false, message: "Choose an Exam Category, Exam, and Paper before importing." };
  if (!(file instanceof File) || !file.size) return { success: false, message: "Choose a CSV file to import." };
  if (file.size > 2_500_000) return { success: false, message: "This CSV is too large. Import up to 2.5 MB at a time." };

  const [{ data: paper }, { data: exam }] = await Promise.all([
    supabase.from("papers").select("id, exam_group_id").eq("id", paperId).maybeSingle(),
    supabase.from("exam_groups").select("id, exam_id").eq("id", examId).maybeSingle(),
  ]);
  if (!paper || !exam || paper.exam_group_id !== exam.id || exam.exam_id !== categoryId) {
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

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const importKey = (row.import_key ?? "").trim().toLocaleLowerCase();
    const subject = subjectByName.get((row.subject ?? "").trim().toLocaleLowerCase());
    const correctAnswer = (row.correct_answer ?? "").trim().toUpperCase() as CorrectAnswer;
    const lifecycle = ((row.content_lifecycle ?? "permanent").trim().toLowerCase() || "permanent") as QuestionLifecycle;
    const reviewOn = (row.review_on ?? "").trim();
    const expiresOn = (row.expires_on ?? "").trim();
    const sourceExamDate = (row.source_exam_date ?? "").trim();
    const isActive = activeValue(row.is_active ?? "");
    const english = languageValues(row, "en");
    const telugu = languageValues(row, "te");

    if (!importKey) errors.push(`Row ${rowNumber}: import_key is required.`);
    if (!subject) errors.push(`Row ${rowNumber}: Subject "${row.subject || "(blank)"}" does not exist in the chosen Paper.`);
    if (subject && importKeys.has(`${subject.id}:${importKey}`)) errors.push(`Row ${rowNumber}: import_key "${importKey}" is repeated for ${subject.name}.`);
    if (subject && importKey) importKeys.add(`${subject.id}:${importKey}`);
    if (!answers.includes(correctAnswer)) errors.push(`Row ${rowNumber}: correct_answer must be A, B, C, or D.`);
    if (!lifecycles.includes(lifecycle) || (lifecycle === "review" && !validDate(reviewOn)) || (lifecycle === "expires" && !validDate(expiresOn))) errors.push(`Row ${rowNumber}: check content_lifecycle and its date.`);
    if (sourceExamDate && !validDate(sourceExamDate)) errors.push(`Row ${rowNumber}: source_exam_date must use YYYY-MM-DD.`);
    if (isActive === null) errors.push(`Row ${rowNumber}: is_active must be true or false.`);

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

    if (!subject || !importKey || !answers.includes(correctAnswer) || !lifecycles.includes(lifecycle) || isActive === null) return;
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

  const { error } = await supabase
    .from("questions")
    .upsert(importRows, { onConflict: "subject_id,import_key" });
  if (error) return { success: false, message: error.message };

  const updated = importRows.filter((row) => existingKeys.has(`${row.subject_id}:${row.import_key}`)).length;
  const added = importRows.length - updated;
  revalidatePath("/admin/questions");
  revalidatePath("/admin/mock-tests");
  return { success: true, message: `${added} Question${added === 1 ? "" : "s"} added and ${updated} updated from ${file.name}.` };
}
