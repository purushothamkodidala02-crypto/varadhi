import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const resetUrl = new URL("/reset-password", requestUrl.origin);
      resetUrl.searchParams.set("next", nextPath);
      return NextResponse.redirect(resetUrl);
    }
  }

  const retryUrl = new URL("/forgot-password", requestUrl.origin);
  retryUrl.searchParams.set("next", nextPath);
  retryUrl.searchParams.set("error", "invalid");
  return NextResponse.redirect(retryUrl);
}
