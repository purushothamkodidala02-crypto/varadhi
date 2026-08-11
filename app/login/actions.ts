"use server";

import { createClient } from "@/lib/supabase/server";

type LoginInput = {
  email: string;
  password: string;
  captchaToken: string;
  nextPath: string;
};

export type LoginResult = {
  success: boolean;
  redirectTo?: string;
  code?: string;
  message?: string;
};

export async function loginWithPassword(input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const nextPath = input.nextPath.startsWith("/") && !input.nextPath.startsWith("//")
    ? input.nextPath
    : "/dashboard";
  if (!email || !input.password || !input.captchaToken) {
    return { success: false, code: "validation_failed", message: "Complete the email, password, and security verification." };
  }

  const supabase = await createClient();
  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
    options: { captchaToken: input.captchaToken },
  });
  if (loginError || !authData.user) {
    const code = loginError?.code ?? "invalid_credentials";
    const message = code === "email_not_confirmed"
      ? "Your account exists, but the email is not confirmed yet."
      : code === "captcha_failed"
        ? "Security verification was rejected. Refresh the page and complete it again."
        : code === "over_request_rate_limit"
          ? "Too many sign-in attempts. Wait a few minutes and try again."
          : "The email or password is incorrect. Check both fields and try again.";
    return { success: false, code, message };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError || !profile) {
    return { success: false, code: "profile_unavailable", message: "Your password was accepted, but the account profile could not be loaded." };
  }
  if (profile.role !== "admin") return { success: true, redirectTo: nextPath };

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) {
    return { success: false, code: "mfa_unavailable", message: "Your password was accepted, but administrator security could not be checked." };
  }
  return { success: true, redirectTo: assurance?.currentLevel === "aal2" ? "/admin" : "/admin-mfa" };
}
