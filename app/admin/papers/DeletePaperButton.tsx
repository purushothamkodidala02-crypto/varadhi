"use client";

import { useState, useTransition } from "react";
import { deletePaper } from "./actions";

export function DeletePaperButton({ paperId, paperName }: { paperId: string; paperName: string }) {
  const [pending, startTransition] = useTransition(); const [message, setMessage] = useState("");
  return <span className="inline-flex flex-col items-end gap-1"><button type="button" disabled={pending} onClick={() => { if (window.confirm(`Delete “${paperName}”? This works only when it has no Subjects.`)) startTransition(async () => setMessage((await deletePaper(paperId)).message)); }} className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50">{pending ? "Deleting..." : "Delete"}</button>{message && <span className="max-w-56 text-right text-xs text-slate-500">{message}</span>}</span>;
}
