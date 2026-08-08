"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MockTestManagementResult = {
  success: boolean;
  message: string;
};

async function getManagedMockTest(mockTestId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return { supabase, error: "You must be logged in." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { supabase, error: "You are not authorized to manage Mock Tests." };
  }

  const { data: mockTest, error: mockTestError } = await supabase
    .from("mock_tests")
    .select("id, title, status")
    .eq("id", mockTestId)
    .single();

  if (mockTestError || !mockTest) return { supabase, error: "Mock Test not found." };

  return { supabase, mockTest };
}

function revalidateMockTestPages(mockTestId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/mock-tests");
  revalidatePath(`/admin/mock-tests/${mockTestId}/edit`);
  revalidatePath("/mock-tests");
}

export async function archiveMockTest(mockTestId: string): Promise<MockTestManagementResult> {
  const result = await getManagedMockTest(mockTestId);
  if ("error" in result) return { success: false, message: result.error ?? "Unable to archive the Mock Test." };

  if (result.mockTest.status !== "published") {
    return { success: false, message: "Only published Mock Tests can be archived." };
  }

  const { error } = await result.supabase
    .from("mock_tests")
    .update({ status: "archived" })
    .eq("id", mockTestId);

  if (error) return { success: false, message: error.message };

  revalidateMockTestPages(mockTestId);
  return { success: true, message: `“${result.mockTest.title}” is archived and hidden from students.` };
}

export async function restoreMockTestAsDraft(mockTestId: string): Promise<MockTestManagementResult> {
  const result = await getManagedMockTest(mockTestId);
  if ("error" in result) return { success: false, message: result.error ?? "Unable to restore the Mock Test." };

  if (result.mockTest.status !== "archived") {
    return { success: false, message: "Only archived Mock Tests can be restored." };
  }

  const { error } = await result.supabase
    .from("mock_tests")
    .update({ status: "draft", published_at: null })
    .eq("id", mockTestId);

  if (error) return { success: false, message: error.message };

  revalidateMockTestPages(mockTestId);
  return { success: true, message: `“${result.mockTest.title}” is restored as a draft.` };
}

export async function deleteDraftMockTest(mockTestId: string): Promise<MockTestManagementResult> {
  const result = await getManagedMockTest(mockTestId);
  if ("error" in result) return { success: false, message: result.error ?? "Unable to delete the Mock Test." };

  if (result.mockTest.status !== "draft") {
    return { success: false, message: "Only draft Mock Tests can be deleted. Archive published tests instead." };
  }

  const { count, error: attemptsError } = await result.supabase
    .from("test_attempts")
    .select("id", { count: "exact", head: true })
    .eq("mock_test_id", mockTestId);

  if (attemptsError) return { success: false, message: "Unable to check student attempts for this Mock Test." };

  if ((count ?? 0) > 0) {
    return { success: false, message: "This Mock Test has student attempts and cannot be deleted. Archive it instead." };
  }

  const { error } = await result.supabase.from("mock_tests").delete().eq("id", mockTestId);
  if (error) return { success: false, message: error.message };

  revalidateMockTestPages(mockTestId);
  return { success: true, message: `“${result.mockTest.title}” was deleted.` };
}
