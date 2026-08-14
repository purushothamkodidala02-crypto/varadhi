"use client";

import { useEffect, useState } from "react";
import { QuestionMedia } from "@/components/questions/QuestionMedia";

export function QuestionImageField({ currentUrl = "" }: { currentUrl?: string | null }) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [filePreview, setFilePreview] = useState("");
  const [remove, setRemove] = useState(false);

  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const preview = remove ? "" : filePreview || url.trim();

  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <legend className="px-2 text-sm font-black text-slate-950">Question image or graph <span className="font-normal text-slate-500">(optional)</span></legend>
      <p className="text-sm leading-6 text-slate-600">Upload a PNG, JPG, or WebP file up to 2 MB, or paste a public HTTPS image URL.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="block text-sm font-bold">
          Upload image
          <input
            name="question_image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              if (filePreview) URL.revokeObjectURL(filePreview);
              const file = event.target.files?.[0];
              setFilePreview(file ? URL.createObjectURL(file) : "");
              if (file) setRemove(false);
            }}
            className="mt-2 block w-full rounded-xl border bg-white p-2 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />
        </label>
        <label className="block text-sm font-bold">
          Image URL
          <input
            name="image_url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => { setUrl(event.target.value); setRemove(false); }}
            placeholder="https://example.com/question-graph.webp"
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal"
          />
        </label>
      </div>
      {currentUrl && (
        <label className="mt-4 flex items-center gap-3 text-sm font-bold text-red-700">
          <input name="remove_image" type="checkbox" checked={remove} onChange={(event) => setRemove(event.target.checked)} className="h-4 w-4" />
          Remove the current question image
        </label>
      )}
      {preview && <QuestionMedia src={preview} alt="Question image preview" className="mt-5" />}
    </fieldset>
  );
}
