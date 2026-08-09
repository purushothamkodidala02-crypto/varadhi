"use client";

import { useActionState } from "react";
import {
  importQuestionsIntoMockTest,
  type ImportQuestionsState,
} from "@/app/admin/questions/import-actions";

type MockTestCsvImportProps = {
  mockTestId: string;
  isDraft: boolean;
  paperName: string;
  subjectName: string | null;
};

const initialState: ImportQuestionsState = { success: false, message: "" };

export function MockTestCsvImport({
  mockTestId,
  isDraft,
  paperName,
  subjectName,
}: MockTestCsvImportProps) {
  const importForMock = importQuestionsIntoMockTest.bind(null, mockTestId);
  const [state, action, pending] = useActionState(importForMock, initialState);

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm">
      <div className="border-b border-teal-100 bg-teal-50/70 px-6 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
          Fastest way to build this test
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          Upload a CSV into this mock test
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          This draft already belongs to <strong>{paperName}</strong>
          {subjectName ? <> and <strong>{subjectName}</strong></> : ""}. The upload saves every
          valid Question in the Question Bank and adds it to this mock test at the same time.
        </p>
      </div>

      {isDraft ? (
        <form action={action} className="p-6 sm:p-7">
          <label className="block rounded-2xl border border-dashed border-teal-300 bg-slate-50 p-5 text-sm font-bold text-slate-800">
            CSV file
            <input
              name="questions_csv"
              type="file"
              accept=".csv,text/csv"
              required
              className="mt-3 block w-full text-sm font-normal file:mr-4 file:rounded-lg file:border-0 file:bg-slate-950 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white"
            />
            <span className="mt-3 block text-xs font-normal leading-5 text-slate-600">
              Up to 500 Questions or 2.5 MB. Add the Subjects under this Paper before importing.
            </span>
          </label>

          <details className="mt-5 rounded-2xl border bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-bold text-slate-900">
              CSV columns for this mock test
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Required Question Bank headings: <code className="break-all rounded bg-white px-1.5 py-1 text-xs">import_key,subject,question_en,option_a_en,option_b_en,option_c_en,option_d_en,question_te,option_a_te,option_b_te,option_c_te,option_d_te,correct_answer</code>
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Add these optional test columns when needed: <code className="rounded bg-white px-1.5 py-1 text-xs">question_order,marks,negative_marks</code>. Leave them blank to use CSV row order and this Paper&apos;s default scoring.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
              <li>The <strong>subject</strong> must already exist under this Paper.</li>
              <li>For a subject-wise mock, every row must use that selected Subject.</li>
              <li>Use the same <strong>import_key</strong> to correct an imported Question later without creating a duplicate.</li>
              <li>General subjects use English and Telugu columns. Language subjects use only their own language columns.</li>
            </ul>
          </details>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              disabled={pending}
              className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Checking and building test..." : "Import and add to mock test"}
            </button>
            <p className="text-sm text-slate-500">You can still add or remove individual Questions below.</p>
          </div>

          {state.message && (
            <p
              aria-live="polite"
              className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}
            >
              {state.message}
            </p>
          )}
        </form>
      ) : (
        <div className="m-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          This Mock Test is published or archived. Its question list is locked.
        </div>
      )}
    </section>
  );
}
