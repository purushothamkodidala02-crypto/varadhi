"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DeleteExamResult = {
  success: boolean;
  message: string;
};

export async function deleteExam(
  examId: string
): Promise<DeleteExamResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be logged in.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return {
      success: false,
      message: "You are not authorized to delete exam categories.",
    };
  }

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, name")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return {
      success: false,
      message: "Exam category not found.",
    };
  }

  const {
    count: groupCount,
    error: groupCountError,
  } = await supabase
    .from("exam_groups")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("exam_id", examId);

  if (groupCountError) {
    return {
      success: false,
      message: "Unable to check the exam’s related groups.",
    };
  }

  if ((groupCount ?? 0) > 0) {
    return {
      success: false,
      message: `Cannot delete "${exam.name}" because it contains ${groupCount} exam(s). Deactivate it instead.`,
    };
  }

  const { error: deleteError } = await supabase
    .from("exams")
    .delete()
    .eq("id", examId);

  if (deleteError) {
    return {
      success: false,
      message: deleteError.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/exams");

  return {
    success: true,
    message: `"${exam.name}" was deleted successfully.`,
  };
}
