import { type PaperInput, validatePaperInputArray } from "./paper-inputs";

export type SpecializationInput = { name: string; slug: string; display_order: number; papers: PaperInput[] };
type RawSpecializationInput = { name?: unknown; papers?: unknown };

function slugBase(name: string, index: number) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `specialisation-${index + 1}`;
}

export function readSpecializationInputs(rawValue: FormDataEntryValue | null): { specializations?: SpecializationInput[]; error?: string } {
  let rawSpecializations: unknown;
  try {
    rawSpecializations = JSON.parse(String(rawValue ?? "[]"));
  } catch {
    return { error: "Specialisation details could not be read. Please try again." };
  }
  if (!Array.isArray(rawSpecializations)) return { error: "Specialisation details are invalid." };
  if (rawSpecializations.length > 20) return { error: "You can add up to 20 Specialisations at one time." };

  const names: string[] = [];
  const papersBySpecialization: PaperInput[][] = [];
  for (const [index, rawSpecialization] of rawSpecializations.entries()) {
    if (!rawSpecialization || typeof rawSpecialization !== "object") return { error: `Specialisation ${index + 1} is invalid.` };
    const item = rawSpecialization as RawSpecializationInput;
    const name = String(item.name ?? "").trim();
    if (!name) return { error: `Enter a name for Specialisation ${index + 1}.` };
    const paperInput = validatePaperInputArray(item.papers, 1);
    if (paperInput.error || !paperInput.papers) return { error: paperInput.error ? `Specialisation ${index + 1}: ${paperInput.error}` : `Add Papers for Specialisation ${index + 1}.` };
    names.push(name);
    papersBySpecialization.push(paperInput.papers);
  }

  const uniqueNames = new Set(names.map((name) => name.toLowerCase()));
  if (uniqueNames.size !== names.length) return { error: "Each Specialisation needs a different name." };
  const usedSlugs = new Set<string>();
  return { specializations: names.map((name, index) => { const base = slugBase(name, index); let slug = base; let suffix = 2; while (usedSlugs.has(slug)) { slug = `${base}-${suffix}`; suffix += 1; } usedSlugs.add(slug); return { name, slug, display_order: index + 1, papers: papersBySpecialization[index] }; }) };
}
