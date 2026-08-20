import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin-mfa",
        "/dashboard",
        "/login",
        "/register",
        "/forgot-password",
        "/recover-account",
        "/reset-password",
        "/auth/",
        "/mock-tests/*/attempt",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
