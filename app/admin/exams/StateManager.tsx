"use client";

import { useActionState } from "react";
import { StateSymbol } from "@/components/exams/CatalogSymbols";
import { PendingSubmitButton } from "@/components/feedback/PendingSubmitButton";
import { createExamState, deleteExamState, toggleExamState, updateExamStateSlug, type StateActionResult } from "@/app/admin/states/actions";

type ManagedState = {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  categoryCount: number;
};

const initialState: StateActionResult = { success: false, message: "" };

export function StateManager({ states }: { states: ManagedState[] }) {
  const [result, action] = useActionState(createExamState, initialState);
  return <details className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 sm:px-7">
      <span><span className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">Catalogue settings</span><strong className="font-display mt-1 block text-xl">Manage states and exam locations</strong><span className="mt-1 block text-sm text-slate-600">Add AP, TG or another catalogue only once. Every board below must belong to one state.</span></span>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-xl text-teal-200">+</span>
    </summary>
    <div className="border-t bg-slate-50/70 p-5 sm:p-7">
      <div className="grid gap-3 md:grid-cols-3">{states.map((state) => <article key={state.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-800"><StateSymbol slug={state.slug} className="h-5 w-5" /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${state.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{state.isActive ? "Visible" : "Hidden"}</span></div><div className="mt-4 flex items-baseline gap-2"><h3 className="font-display text-lg">{state.name}</h3><span className="text-xs font-black text-teal-700">{state.code}</span></div><p className="mt-1 text-xs text-slate-500">/{state.slug} · {state.categoryCount} boards</p><form action={updateExamStateSlug} className="mt-4 flex gap-2"><input type="hidden" name="id" value={state.id} /><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={state.slug} aria-label={`${state.name} URL slug`} className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs" /><PendingSubmitButton pendingLabel="Saving…" className="rounded-lg border px-3 py-2 text-xs font-bold">Save URL</PendingSubmitButton></form><p className="mt-2 text-[11px] text-slate-500">Changing this keeps the previous URL as a permanent redirect.</p><div className="mt-4 flex gap-2 border-t pt-4"><form action={toggleExamState}><input type="hidden" name="id" value={state.id} /><input type="hidden" name="is_active" value={String(state.isActive)} /><PendingSubmitButton pendingLabel={state.isActive ? "Hiding…" : "Showing…"} className="rounded-lg border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">{state.isActive ? "Hide" : "Show"}</PendingSubmitButton></form>{state.categoryCount === 0 && <form action={deleteExamState}><input type="hidden" name="id" value={state.id} /><PendingSubmitButton pendingLabel="Deleting…" className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">Delete</PendingSubmitButton></form>}</div></article>)}</div>
      <form action={action} className="mt-6 grid gap-4 rounded-2xl border border-teal-100 bg-white p-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-4"><p className="text-xs font-black uppercase tracking-[0.13em] text-teal-700">Add another state or catalogue</p></div>
        <label className="text-sm font-bold">Name<input name="name" required placeholder="Example: Andhra Pradesh" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
        <label className="text-sm font-bold">Short code<input name="code" required maxLength={8} placeholder="AP" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal uppercase" /></label>
        <label className="text-sm font-bold">URL slug<input name="slug" pattern="[a-z0-9-]+" placeholder="andhra-pradesh" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
        <label className="text-sm font-bold">Display order<input name="display_order" type="number" min="0" defaultValue={states.length + 1} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
        <label className="text-sm font-bold md:col-span-2 lg:col-span-3">Student description<input name="description" placeholder="Short explanation shown on the student site" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
        <div className="flex items-end"><PendingSubmitButton pendingLabel="Adding catalogue…" className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">Add catalogue</PendingSubmitButton></div>
        {result.message && <p className={`text-sm font-semibold md:col-span-2 lg:col-span-4 ${result.success ? "text-emerald-700" : "text-red-700"}`}>{result.message}</p>}
      </form>
    </div>
  </details>;
}
