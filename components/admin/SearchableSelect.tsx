"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

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

export function SearchableSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  emptyMessage = "No matching options.",
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [activeIndex, setActiveIndex] = useState(-1);
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return options.filter(
      (option) => !normalized || option.label.toLowerCase().includes(normalized),
    );
  }, [options, query]);
  const showList = open && !disabled;

  function closeList() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function selectOption(option: SearchableSelectOption) {
    onChange(option.value);
    setQuery(option.label);
    closeList();
  }

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "");
      setActiveIndex(-1);
    }
  }, [open, selected?.label, value]);

  useEffect(() => {
    function closeWhenClickingAway(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeList();
      }
    }

    document.addEventListener("mousedown", closeWhenClickingAway);
    return () => document.removeEventListener("mousedown", closeWhenClickingAway);
  }, []);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    listRef.current
      .querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, matches]);

  return (
    <div ref={containerRef} className="relative mt-2">
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        disabled={disabled}
        value={open ? query : selected?.label ?? ""}
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActiveIndex(-1);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
          if (value) onChange("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeList();
            return;
          }

          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              setQuery("");
            }
            if (matches.length === 0) return;
            setActiveIndex((current) => {
              if (event.key === "ArrowDown") {
                return current < matches.length - 1 ? current + 1 : 0;
              }
              return current > 0 ? current - 1 : matches.length - 1;
            });
            return;
          }

          if (event.key === "Enter" && showList && activeIndex >= 0) {
            const activeOption = matches[activeIndex];
            if (activeOption) {
              event.preventDefault();
              selectOption(activeOption);
            }
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border py-3 pl-4 pr-12 font-normal outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      />
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (open) {
            closeList();
          } else {
            setOpen(true);
            setQuery("");
            setActiveIndex(-1);
            inputRef.current?.focus();
          }
        }}
        aria-label={open ? "Close options" : "Open options"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {showList && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-xl shadow-slate-950/10"
        >
          {matches.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">{emptyMessage}</p>
          ) : (
            <>
              <div ref={listRef} className="max-h-52 overflow-y-auto overscroll-contain p-1">
                {matches.map((option, index) => (
                  <button
                    key={option.value}
                    id={`${listboxId}-option-${index}`}
                    data-option-index={index}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                    className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      activeIndex === index
                        ? "bg-teal-100 font-bold text-teal-900"
                        : option.value === value
                          ? "bg-teal-50 font-bold text-teal-800"
                          : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="border-t bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                {matches.length === options.length
                  ? `${options.length} total ${options.length === 1 ? "value" : "values"}`
                  : `${matches.length} of ${options.length} matching values`}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
