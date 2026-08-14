import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const QUESTION_MEDIA_BUCKET = "question-media";
export const MAX_QUESTION_IMAGE_BYTES = 2_000_000;

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function normalizeQuestionImageUrl(value: unknown) {
  const candidate = String(value ?? "").trim();
  if (!candidate) return { url: null as string | null, error: null as string | null };

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return { url: null, error: "Question images must use a public HTTPS URL." };
    }
    return { url: parsed.toString(), error: null };
  } catch {
    return { url: null, error: "Question image URL is not valid." };
  }
}

export async function uploadQuestionImage(
  supabase: SupabaseClient,
  userId: string,
  file: File,
) {
  const extension = allowedImageTypes.get(file.type);
  if (!extension) {
    return { url: null, path: null, error: "Use a PNG, JPG, or WebP question image." };
  }
  if (file.size > MAX_QUESTION_IMAGE_BYTES) {
    return { url: null, path: null, error: "Question images must be 2 MB or smaller." };
  }

  const path = `${userId}/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(QUESTION_MEDIA_BUCKET).upload(path, bytes, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) return { url: null, path: null, error: `Image upload failed: ${error.message}` };

  const { data } = supabase.storage.from(QUESTION_MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, error: null };
}

export function questionMediaPath(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${QUESTION_MEDIA_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export async function removeQuestionImage(supabase: SupabaseClient, path: string | null) {
  if (!path) return;
  await supabase.storage.from(QUESTION_MEDIA_BUCKET).remove([path]);
}
