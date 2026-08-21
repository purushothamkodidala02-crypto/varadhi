export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function stateUrl(stateSlug: string) {
  return `/mock-tests/${stateSlug}`;
}

export function categoryUrl(stateSlug: string, categorySlug: string) {
  return `${stateUrl(stateSlug)}/category/${categorySlug}`;
}

export function examUrl(stateSlug: string, examSlug: string) {
  return `${stateUrl(stateSlug)}/${examSlug}`;
}

export function specializationUrl(stateSlug: string, examSlug: string, specializationSlug: string) {
  return `${examUrl(stateSlug, examSlug)}/specialization/${specializationSlug}`;
}

export function paperUrl(stateSlug: string, examSlug: string, paperSlug: string) {
  return `${examUrl(stateSlug, examSlug)}/${paperSlug}`;
}

export function subjectUrl(stateSlug: string, examSlug: string, paperSlug: string, subjectSlug: string) {
  return `${paperUrl(stateSlug, examSlug, paperSlug)}/subject/${subjectSlug}`;
}

export function mockTestUrl(stateSlug: string, examSlug: string, paperSlug: string, mockTestSlug: string) {
  return `${paperUrl(stateSlug, examSlug, paperSlug)}/${mockTestSlug}`;
}

export function mockTestSlug(seriesNumber: number, subjectSlug?: string | null) {
  const series = String(Math.max(1, seriesNumber)).padStart(2, "0");
  return `${subjectSlug ? `${subjectSlug}-` : ""}mock-test-${series}`;
}
