"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function beginMockTest(
  mockTestId: string,
  mode: "resume" | "restart",
) {
  if (!UUID_PATTERN.test(mockTestId)) redirect("/mock-tests");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/mock-tests/${mockTestId}`)}`);
  }

  const functionName =
    mode === "restart"
      ? "restart_mock_test_session"
      : "start_mock_test_session";
  const { data, error } = await supabase.rpc(functionName, {
    requested_mock_test_id: mockTestId,
  });
  const session = data?.[0] as { session_id?: string } | undefined;

  if (error || !session?.session_id) {
    redirect(`/mock-tests/${mockTestId}?start_error=1`);
  }

  redirect(
    `/mock-tests/${mockTestId}/attempt?session=${encodeURIComponent(session.session_id)}`,
  );
}
