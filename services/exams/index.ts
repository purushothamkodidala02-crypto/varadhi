import { supabase } from "@/lib/supabase";
import type { CreateExamInput, Exam } from "@/types/exam";

export async function getExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createExam(
  input: CreateExamInput
): Promise<Exam> {
  const { data, error } = await supabase
    .from("exams")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      is_active: input.is_active ?? true,
      display_order: input.display_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}