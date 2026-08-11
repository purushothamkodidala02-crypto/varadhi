export const SITE_NAME = "Varadhi Prep";
export const SITE_DESCRIPTION =
  "Smart mock tests for career growth, with English and Telugu practice, flexible timed attempts, and detailed answer review.";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://varadhiprep.in";

export const SITE_URL = configuredSiteUrl.replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
