"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CATALOG_TAG } from "@/lib/catalog-data";
import { readSeoFields } from "@/lib/seo-fields";
import { createClient } from "@/lib/supabase/server";

export type SeoEntityType = "paper" | "subject" | "mock_test";
export type UpdateSeoState = { success: boolean; message: string };

const tableByType = { paper: "papers", subject: "subjects", mock_test: "mock_tests" } as const;

export async function updateEntitySeo(entityType: SeoEntityType, entityId: string, _previous: UpdateSeoState, formData: FormData): Promise<UpdateSeoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be logged in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { success: false, message: "Admin access is required." };
  const seo = readSeoFields(formData);
  if (seo.error) return { success: false, message: seo.error };
  const { data, error } = await supabase.from(tableByType[entityType]).update(seo.value).eq("id", entityId).select("id").maybeSingle();
  if (error) return { success: false, message: error.message };
  if (!data) return { success: false, message: "This item could not be found." };
  revalidatePath("/mock-tests");
  revalidatePath("/admin/exams");
  revalidatePath("/admin/papers");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/mock-tests");
  revalidateTag(PUBLIC_CATALOG_TAG, "max");
  return { success: true, message: "Google search appearance saved." };
}
