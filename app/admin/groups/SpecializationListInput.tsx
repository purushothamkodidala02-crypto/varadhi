"use client";

import { useState } from "react";

type SpecializationDraft = { key: number; name: string };

function newSpecialization(key: number): SpecializationDraft {
  return { key, name: "" };
}

export function SpecializationListInput() {
  const [specializations, setSpecializations] = useState<SpecializationDraft[]>([]);

  function addSpecialization() {
    setSpecializations((current) => [
      ...current,
      newSpecialization(Math.max(0, ...current.map((item) => item.key)) + 1),
    ]);
  }

  return (
    <section className="rounded-xl border border-teal-100 bg-teal-50/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">Specialisations <span className="font-normal text-slate-500">optional</span></h3>
          <p className="mt-1 text-sm text-slate-600">
            Add branches only when this Exam has different streams, such as AEE Civil, Electrical, or Mechanical.
          </p>
        </div>
        <button type="button" onClick={addSpecialization} className="rounded-lg border border-teal-700 px-3 py-2 text-sm font-bold text-teal-800 hover:bg-white">
          + Add Specialisation
        </button>
      </div>

      {specializations.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-teal-200 bg-white/70 p-3 text-sm text-slate-600">
          No branches needed? Leave this empty. This is right for Exams such as Group 1, Group 2, or Group 4.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {specializations.map((specialization, index) => (
            <div key={specialization.key} className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
              <label className="min-w-[16rem] flex-1 text-sm font-semibold">
                Specialisation {index + 1} name
                <input
                  value={specialization.name}
                  onChange={(event) => setSpecializations((current) => current.map((item) => item.key === specialization.key ? { ...item, name: event.target.value } : item))}
                  placeholder="For example: Civil Engineering"
                  className="mt-1.5 w-full rounded-lg border px-3 py-2.5 font-normal"
                />
              </label>
              <button type="button" onClick={() => setSpecializations((current) => current.filter((item) => item.key !== specialization.key))} className="pb-2 text-sm font-semibold text-red-600 hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <input type="hidden" name="specializations_json" value={JSON.stringify(specializations.map(({ name }) => ({ name })))} />
    </section>
  );
}
