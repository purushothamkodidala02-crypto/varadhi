"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteSpecialization } from "./actions";

export function DeleteSpecializationButton({ specializationId, name }: { specializationId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="flex items-center gap-3">
        <Link href={`/admin/specializations/${specializationId}/edit`} className="text-sm font-semibold text-teal-700 hover:underline">Edit</Link>
        <button type="button" disabled={pending} onClick={() => { if (window.confirm(`Delete \"${name}\"? This works only when it has no Papers.`)) startTransition(async () => setMessage((await deleteSpecialization(specializationId)).message)); }} className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50">{pending ? "Deleting..." : "Delete"}</button>
      </span>
      {message && <span className="max-w-56 text-right text-xs text-slate-500">{message}</span>}
    </span>
  );
}
