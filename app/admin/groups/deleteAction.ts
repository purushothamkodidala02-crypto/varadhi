"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DeleteGroupResult = {
  success: boolean;
  message: string;
};

export async function deleteGroup(
  groupId: string
): Promise<DeleteGroupResult> {
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
      message: "You are not authorized to delete groups.",
    };
  }

  const { data: group, error: groupError } = await supabase
    .from("exam_groups")
    .select("id, name")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return {
      success: false,
      message: "Group not found.",
    };
  }

  const {
    count: subjectCount,
    error: subjectCountError,
  } = await supabase
    .from("subjects")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("exam_group_id", groupId);

  if (subjectCountError) {
    return {
      success: false,
      message: "Unable to check the Group’s related Subjects.",
    };
  }

  if ((subjectCount ?? 0) > 0) {
    return {
      success: false,
      message: `Cannot delete "${group.name}" because it contains ${subjectCount} subject(s). Deactivate it instead.`,
    };
  }

  const { error: deleteError } = await supabase
    .from("exam_groups")
    .delete()
    .eq("id", groupId);

  if (deleteError) {
    return {
      success: false,
      message: deleteError.message,
    };
  }

  revalidatePath("/admin/groups");

  return {
    success: true,
    message: `"${group.name}" was deleted successfully.`,
  };
}