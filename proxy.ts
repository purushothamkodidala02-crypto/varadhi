import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function buildContentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV === "development";
  let supabaseOrigin = "https://*.supabase.co";
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
    }
  } catch {
    // Keep the restrictive Supabase fallback when an environment value is invalid.
  }

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseOrigin}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin} https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "frame-src https://challenges.cloudflare.com",
    ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  // Anonymous catalogue traffic does not need an Auth round trip. These pages
  // contain no user-specific content and can be served from the public cache.
  if (request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/mock-tests") {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          requestHeaders.set("cookie", request.headers.get("cookie") ?? "");

          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          response.headers.set("Content-Security-Policy", contentSecurityPolicy);

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
