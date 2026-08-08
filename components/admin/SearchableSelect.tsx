"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = { value: string; label: string };

type SearchableSelectProps = {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  disabled?: boolean;
  emptyMessage?: string;
};

export function SearchableSelect({ name, value, onChange, options, placeholder, disabled = false, emptyMessage = "No matching options." }: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? "");
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return options.filter((option) => !normalized || option.label.toLowerCase().includes(normalized));
  }, [options, query]);

  useEffect(() => { setQuery(selected?.label ?? ""); }, [selected?.label, value]);
  useEffect(() => {
    function closeWhenClickingAway(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeWhenClickingAway);
    return () => document.removeEventListener("mousedown", closeWhenClickingAway);
  }, []);

  return <div ref={containerRef} className="relative mt-2"><input type="hidden" name={name} value={value} /><input role="combobox" aria-expanded={open} aria-autocomplete="list" disabled={disabled} value={open ? query : selected?.label ?? ""} onFocus={() => { setOpen(true); setQuery(""); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); if (value) onChange(""); }} placeholder={placeholder} className="w-full rounded-xl border px-4 py-3 font-normal outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100" />{open && !disabled && <div role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-white p-1 shadow-xl shadow-slate-950/10">{matches.length === 0 ? <p className="px-3 py-3 text-sm text-slate-500">{emptyMessage}</p> : matches.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(option.value); setQuery(option.label); setOpen(false); }} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${option.value === value ? "bg-teal-50 font-bold text-teal-800" : "text-slate-700 hover:bg-slate-100"}`}>{option.label}</button>)}</div>}</div>;
}
