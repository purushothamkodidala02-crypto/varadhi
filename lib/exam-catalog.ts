export function formatMockNumber(seriesNumber: number) {
  return String(Math.max(1, seriesNumber)).padStart(2, "0");
}

export function mockTestLabel(seriesNumber: number) {
  return `Mock Test ${formatMockNumber(seriesNumber)}`;
}

export function buildMockTestTitle({
  stateCode,
  examName,
  paperNumber,
  subjectName,
  seriesNumber,
}: {
  stateCode: string;
  examName: string;
  paperNumber: number;
  subjectName?: string | null;
  seriesNumber: number;
}) {
  const location = `${stateCode} ${examName} · Paper ${paperNumber}`;
  return `${location}${subjectName ? ` · ${subjectName}` : ""} · ${mockTestLabel(seriesNumber)}`;
}

export function toCatalogSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function examCollectionSlug(examName: string) {
  const descriptiveName = examName.replace(/\s*\([^)]*\)\s*$/, "");
  const slug = toCatalogSlug(descriptiveName);
  return slug.endsWith("-mock-tests") ? slug : `${slug}-mock-tests`;
}

export function examCollectionPath(stateSlug: string, examName: string) {
  return `/mock-tests/${toCatalogSlug(stateSlug)}/${examCollectionSlug(examName)}`;
}

export function inferExamKind(name: string) {
  const normalized = name.toLowerCase();
  if (/police|constable|\bsi\b|sub[- ]?inspector/.test(normalized)) return "police" as const;
  if (/teacher|tet|dsc|school|education/.test(normalized)) return "education" as const;
  if (/engineer|aee|ae\b|technical/.test(normalized)) return "engineering" as const;
  if (/executive|officer|group|service|psc/.test(normalized)) return "administration" as const;
  return "general" as const;
}
