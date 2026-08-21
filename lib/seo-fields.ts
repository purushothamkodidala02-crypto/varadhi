export const SEO_TITLE_MAX_LENGTH = 100;
export const SEO_DESCRIPTION_MAX_LENGTH = 320;

export type SeoFields = {
  seo_title?: string | null;
  seo_description?: string | null;
};

export function readSeoFields(formData: FormData): {
  value: { seo_title: string | null; seo_description: string | null };
  error: string | null;
} {
  const title = String(formData.get("seo_title") ?? "").trim();
  const description = String(formData.get("seo_description") ?? "").trim();

  if (title.length > SEO_TITLE_MAX_LENGTH) {
    return { value: { seo_title: null, seo_description: null }, error: `SEO title must be ${SEO_TITLE_MAX_LENGTH} characters or fewer.` };
  }
  if (description.length > SEO_DESCRIPTION_MAX_LENGTH) {
    return { value: { seo_title: null, seo_description: null }, error: `SEO description must be ${SEO_DESCRIPTION_MAX_LENGTH} characters or fewer.` };
  }

  return {
    value: {
      seo_title: title || null,
      seo_description: description || null,
    },
    error: null,
  };
}

export function resolveSeoFields(
  entity: SeoFields,
  fallback: { title: string; description: string },
) {
  return {
    title: entity.seo_title?.trim() || fallback.title,
    description: entity.seo_description?.trim() || fallback.description,
  };
}
