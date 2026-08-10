export const SITE_NAME = "Varadhi";
export const SITE_DESCRIPTION =
  "Free TGPSC mock tests for Telangana aspirants, with English and Telugu practice, timed attempts, and detailed answer review.";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://varadhi-varadhi.vercel.app";

export const SITE_URL = configuredSiteUrl.replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
