export type PaperInput = {
  name: string;
  duration_minutes: number | null;
  question_count: number | null;
};

type RawPaperInput = {
  name?: unknown;
  duration_minutes?: unknown;
  question_count?: unknown;
};

function readOptionalPositiveInteger(value: unknown, label: string): number | null | string {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) && number > 0 ? number : `${label} must be a positive whole number.`;
}

export function readPaperInputs(rawValue: FormDataEntryValue | null, minimum: number): { papers?: PaperInput[]; error?: string } {
  let rawPapers: unknown;
  try {
    rawPapers = JSON.parse(String(rawValue ?? "[]"));
  } catch {
    return { error: "Paper details could not be read. Please try again." };
  }

  if (!Array.isArray(rawPapers)) return { error: "Paper details are invalid." };
  if (rawPapers.length < minimum) return { error: minimum === 1 ? "Add at least one Paper for this Exam." : "Add valid Papers or remove the empty row." };
  if (rawPapers.length > 20) return { error: "You can add up to 20 Papers at one time." };

  const papers: PaperInput[] = [];
  for (const [index, rawPaper] of rawPapers.entries()) {
    if (!rawPaper || typeof rawPaper !== "object") return { error: `Paper ${index + 1} is invalid.` };
    const item = rawPaper as RawPaperInput;
    const name = String(item.name ?? "").trim();
    if (!name) return { error: `Enter a name for Paper ${index + 1}.` };
    const duration = readOptionalPositiveInteger(item.duration_minutes, `Paper ${index + 1} duration`);
    const questionCount = readOptionalPositiveInteger(item.question_count, `Paper ${index + 1} question count`);
    if (typeof duration === "string") return { error: duration };
    if (typeof questionCount === "string") return { error: questionCount };
    papers.push({ name, duration_minutes: duration, question_count: questionCount });
  }

  const names = new Set(papers.map((paper) => paper.name.toLocaleLowerCase()));
  if (names.size !== papers.length) return { error: "Each Paper needs a different name." };
  return { papers };
}

function paperSlugBase(name: string, index: number): string {
  const slug = name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `paper-${index + 1}`;
}

export function toPaperRows(examGroupId: string, papers: PaperInput[], currentSlugs: string[] = [], displayOrderStart = 1) {
  const usedSlugs = new Set(currentSlugs);
  return papers.map((paper, index) => {
    const base = paperSlugBase(paper.name, index);
    let slug = base;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);
    return { exam_group_id: examGroupId, name: paper.name, slug, duration_minutes: paper.duration_minutes, question_count: paper.question_count, default_negative_marks: 0, display_order: displayOrderStart + index, is_active: true };
  });
}
