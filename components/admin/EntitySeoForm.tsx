"use client";

import { useActionState } from "react";
import { updateEntitySeo, type SeoEntityType, type UpdateSeoState } from "@/app/admin/seo/actions";
import { SeoFields } from "@/components/admin/SeoFields";

const initialState: UpdateSeoState = { success: false, message: "" };

export function EntitySeoForm({ entityType, entityId, title, description, titlePlaceholder, descriptionPlaceholder }: { entityType: SeoEntityType; entityId: string; title: string | null; description: string | null; titlePlaceholder: string; descriptionPlaceholder: string }) {
  const [result, action, pending] = useActionState(updateEntitySeo.bind(null, entityType, entityId), initialState);
  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">Google search appearance</h2>
      <p className="mt-1 text-sm text-slate-600">This changes search and social metadata only. It does not change the name, slug, questions or student content.</p>
      <form action={action} className="mt-5">
        <SeoFields title={title} description={description} titlePlaceholder={titlePlaceholder} descriptionPlaceholder={descriptionPlaceholder} />
        <button disabled={pending} className="mt-4 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving search appearance…" : "Save search appearance"}</button>
        {result.message && <p aria-live="polite" className={`mt-3 text-sm font-semibold ${result.success ? "text-emerald-700" : "text-red-700"}`}>{result.message}</p>}
      </form>
    </section>
  );
}
