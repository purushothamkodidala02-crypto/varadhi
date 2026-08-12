import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function forgotPasswordUrl(origin: string, nextPath: string) {
  const retryUrl = new URL("/forgot-password", origin);
  retryUrl.searchParams.set("next", nextPath);
  retryUrl.searchParams.set("error", "invalid");
  return retryUrl;
}

function resetPasswordUrl(origin: string, nextPath: string) {
  const resetUrl = new URL("/reset-password", origin);
  resetUrl.searchParams.set("next", nextPath);
  return resetUrl;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));

  // A custom recovery email sends a device-independent token hash here.
  // Do not consume it on GET: mail security scanners frequently prefetch links.
  // Instead, send the person to a confirmation page that submits a POST.
  if (tokenHash && tokenHash.length <= 2048 && type === "recovery") {
    const confirmationUrl = new URL("/recover-account", requestUrl.origin);
    confirmationUrl.searchParams.set("token_hash", tokenHash);
    confirmationUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(confirmationUrl);
  }

  // Keep the existing PKCE callback as a compatibility fallback for reset
  // emails that were generated before the custom token-hash template.
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(resetPasswordUrl(requestUrl.origin, nextPath));
    }
  }

  return NextResponse.redirect(forgotPasswordUrl(requestUrl.origin, nextPath));
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(
      forgotPasswordUrl(requestUrl.origin, "/dashboard"),
      303,
    );
  }

  const tokenValue = formData.get("token_hash");
  const nextValue = formData.get("next");
  const tokenHash = typeof tokenValue === "string" ? tokenValue : "";
  const nextPath = safeNextPath(typeof nextValue === "string" ? nextValue : null);

  if (!tokenHash || tokenHash.length > 2048) {
    return NextResponse.redirect(
      forgotPasswordUrl(requestUrl.origin, nextPath),
      303,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (error) {
    return NextResponse.redirect(
      forgotPasswordUrl(requestUrl.origin, nextPath),
      303,
    );
  }

  return NextResponse.redirect(
    resetPasswordUrl(requestUrl.origin, nextPath),
    303,
  );
}
