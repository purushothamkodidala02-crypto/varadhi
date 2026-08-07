"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DeleteSubjectResult = {
  success: boolean;
  message: string;
};

export async function deleteSubject(
  subjectId: string
): Promise<DeleteSubjectResult> {
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
      message: "You are not authorized to delete Subjects.",
    };
  }

  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", subjectId)
    .single();

  if (subjectError || !subject) {
    return {
      success: false,
      message: "Subject not found.",
    };
  }

  const {
    count: mockTestCount,
    error: mockTestCountError,
  } = await supabase
    .from("mock_tests")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("subject_id", subjectId);

  if (mockTestCountError) {
    return {
      success: false,
      message: "Unable to check the Subject’s related Mock Tests.",
    };
  }

  if ((mockTestCount ?? 0) > 0) {
    return {
      success: false,
      message: `Cannot delete "${subject.name}" because it contains ${mockTestCount} Mock Test(s). Deactivate it instead.`,
    };
  }

  const { error: deleteError } = await supabase
    .from("subjects")
    .delete()
    .eq("id", subjectId);

  if (deleteError) {
    return {
      success: false,
      message: deleteError.message,
    };
  }

  revalidatePath("/admin/subjects");

  return {
    success: true,
    message: `"${subject.name}" was deleted successfully.`,
  };
}