"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CorrectAnswer, QuestionLifecycle } from "@/types/question";

export type CreateQuestionState = { success: boolean; message: string };
const answers: CorrectAnswer[] = ["A", "B", "C", "D"]; const lifecycles: QuestionLifecycle[] = ["permanent", "review", "expires"];
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export async function createQuestion(_previous: CreateQuestionState, formData: FormData): Promise<CreateQuestionState> {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, message: "You are not authorized to create Questions." };
  const categoryId = String(formData.get("exam_id") ?? "").trim(); const examId = String(formData.get("exam_group_id") ?? "").trim(); const paperId = String(formData.get("paper_id") ?? "").trim(); const subjectId = String(formData.get("subject_id") ?? "").trim();
  const questionText = String(formData.get("question_text") ?? "").trim(); const options = ["a", "b", "c", "d"].map((letter) => String(formData.get(`option_${letter}`) ?? "").trim()); const correctAnswer = String(formData.get("correct_answer") ?? "") as CorrectAnswer; const lifecycle = String(formData.get("content_lifecycle") ?? "permanent") as QuestionLifecycle; const reviewOn = String(formData.get("review_on") ?? "").trim(); const expiresOn = String(formData.get("expires_on") ?? "").trim();
  if (!categoryId || !examId || !paperId || !subjectId) return { success: false, message: "Choose an Exam Category, Exam, Paper, and Subject." };
  if (!questionText || options.some((option) => !option)) return { success: false, message: "Enter the Question and all four answer options." };
  if (new Set(options.map((option) => option.toLowerCase())).size !== 4) return { success: false, message: "All four answer options must be different." };
  if (!answers.includes(correctAnswer)) return { success: false, message: "Choose the correct option." };
  if (!lifecycles.includes(lifecycle) || (lifecycle === "review" && !validDate(reviewOn)) || (lifecycle === "expires" && !validDate(expiresOn))) return { success: false, message: "Choose a valid question lifetime and date." };
  const { data: subject } = await supabase.from("subjects").select("id, paper_id").eq("id", subjectId).maybeSingle(); const { data: paper } = await supabase.from("papers").select("id, exam_group_id").eq("id", paperId).maybeSingle(); const { data: group } = await supabase.from("exam_groups").select("id, exam_id").eq("id", examId).maybeSingle();
  if (!subject || !paper || !group || subject.paper_id !== paper.id || paper.exam_group_id !== group.id || group.exam_id !== categoryId) return { success: false, message: "The selected category, Exam, Paper, and Subject do not belong together." };
  const { data: duplicate } = await supabase.from("questions").select("id").eq("subject_id", subjectId).eq("question_text", questionText).maybeSingle();
  if (duplicate) return { success: false, message: "This Question already exists under the selected Subject." };
  const { error } = await supabase.from("questions").insert({ subject_id: subjectId, question_text: questionText, question_type: "mcq", option_a: options[0], option_b: options[1], option_c: options[2], option_d: options[3], correct_answer: correctAnswer, explanation: String(formData.get("explanation") ?? "").trim() || null, source_reference: String(formData.get("source_reference") ?? "").trim() || null, image_url: String(formData.get("image_url") ?? "").trim() || null, difficulty: "medium", is_active: formData.get("is_active") === "on", content_lifecycle: lifecycle, review_on: lifecycle === "review" ? reviewOn : null, expires_on: lifecycle === "expires" ? expiresOn : null });
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/questions"); revalidatePath("/admin/mock-tests");
  return { success: true, message: "Question added to the Question Bank." };
}
