import { SEO_DESCRIPTION_MAX_LENGTH, SEO_TITLE_MAX_LENGTH } from "@/lib/seo-fields";

export function SeoFields({
  title,
  description,
  titlePlaceholder,
  descriptionPlaceholder,
  className = "",
}: {
  title?: string | null;
  description?: string | null;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  className?: string;
}) {
  return (
    <fieldset className={`rounded-2xl border border-blue-200 bg-blue-50/50 p-5 ${className}`}>
      <legend className="px-2 text-sm font-black text-blue-950">Google search appearance</legend>
      <p className="mb-4 text-xs leading-5 text-blue-900/75">
        Optional. Leave either field empty to use the automatic text. Do not add “| Varadhi Prep” because the website adds it automatically.
      </p>
      <div className="grid gap-4">
        <label className="block text-sm font-bold text-slate-900">
          SEO title
          <input
            name="seo_title"
            maxLength={SEO_TITLE_MAX_LENGTH}
            defaultValue={title ?? ""}
            placeholder={titlePlaceholder}
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal"
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">Shown as the suggested Google result title.</span>
        </label>
        <label className="block text-sm font-bold text-slate-900">
          SEO description
          <textarea
            name="seo_description"
            maxLength={SEO_DESCRIPTION_MAX_LENGTH}
            rows={3}
            defaultValue={description ?? ""}
            placeholder={descriptionPlaceholder}
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal"
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">A concise, accurate summary for search results and social sharing.</span>
        </label>
      </div>
    </fieldset>
  );
}
