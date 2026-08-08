"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createQuestion, type CreateQuestionState } from "./actions";
import type { QuestionLifecycle } from "@/types/question";

type ExamOption = { id: string; name: string };
type GroupOption = { id: string; examId: string; name: string };
type SubjectOption = { id: string; examGroupId: string; name: string };
type CreateQuestionFormProps = { exams: ExamOption[]; groups: GroupOption[]; subjects: SubjectOption[] };

const initialState: CreateQuestionState = { success: false, message: "" };

export function CreateQuestionForm({ exams, groups, subjects }: CreateQuestionFormProps) {
  const [state, formAction, pending] = useActionState(createQuestion, initialState);
  const [lifecycle, setLifecycle] = useState<QuestionLifecycle>("permanent");
  const [availabilityScope, setAvailabilityScope] = useState<"all_exam_entries" | "selected_entry">("all_exam_entries");
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [examGroupId, setExamGroupId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [entrySearch, setEntrySearch] = useState("");
  const [entryMenuOpen, setEntryMenuOpen] = useState(false);
  const entryDropdownRef = useRef<HTMLElement>(null);
  const hasSubjects = subjects.length > 0;

  const visibleGroups = useMemo(() => {
    const query = entrySearch.trim().toLowerCase();
    return groups.filter((group) => selectedExamIds.includes(group.examId) && (!query || group.name.toLowerCase().includes(query)));
  }, [entrySearch, groups, selectedExamIds]);
  const visibleSubjects = useMemo(() => subjects.filter((subject) => subject.examGroupId === examGroupId), [examGroupId, subjects]);
  const selectedExamNames = exams.filter((exam) => selectedExamIds.includes(exam.id)).map((exam) => exam.name);
  const selectedGroupName = groups.find((group) => group.id === examGroupId)?.name ?? "the selected Exam";

  useEffect(() => {
    function closeWhenClickingOutside(event: MouseEvent) {
      if (entryDropdownRef.current && !entryDropdownRef.current.contains(event.target as Node)) {
        setEntryMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeWhenClickingOutside);
    return () => document.removeEventListener("mousedown", closeWhenClickingOutside);
  }, []);

  function chooseGroup(nextGroupId: string) {
    setExamGroupId(nextGroupId);
    setSubjectId(subjects.find((subject) => subject.examGroupId === nextGroupId)?.id ?? "");
  }

  function toggleExam(nextExamId: string, checked: boolean) {
    const nextExamIds = checked ? Array.from(new Set([...selectedExamIds, nextExamId])) : selectedExamIds.filter((id) => id !== nextExamId);
    const currentGroupIsVisible = groups.some((group) => group.id === examGroupId && nextExamIds.includes(group.examId));
    setSelectedExamIds(nextExamIds);
    setEntrySearch("");
    setEntryMenuOpen(false);
    if (!currentGroupIsVisible) chooseGroup("");
  }

  function searchEntries(nextSearch: string) {
    setEntrySearch(nextSearch);
    setEntryMenuOpen(true);
  }

  return (
    <section id="add-question" className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">New question</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Add a question to your library</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Tick the exam category first. Then choose one of its Exams and the matching subject.</p>
      </div>

      {!hasSubjects ? <div className="p-7"><p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Add an exam category, Exam, and subject before creating questions.</p></div> : (
        <form action={formAction} className="p-6 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">1. Choose where it belongs</p>

              <fieldset className="mt-4"><legend className="text-sm font-bold text-slate-800">Choose exam category</legend><p className="mt-1 text-xs leading-5 text-slate-500">Tick TGPSC, TET, or another category. This question will automatically be available in every Exam under each checked category.</p><div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3">{exams.map((exam) => <label key={exam.id} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700"><input name="exam_ids" value={exam.id} type="checkbox" checked={selectedExamIds.includes(exam.id)} onChange={(event) => toggleExam(exam.id, event.target.checked)} className="h-4 w-4 accent-teal-700" />{exam.name}</label>)}</div></fieldset>

              <section ref={entryDropdownRef} className="mt-5 rounded-2xl border border-slate-200 bg-white p-3">
                <label htmlFor="entry_search" className="block text-sm font-bold text-slate-800">Exam</label>
                <div className="relative mt-2"><input id="entry_search" role="combobox" aria-controls="exam-entry-results" aria-expanded={entryMenuOpen} aria-autocomplete="list" type="search" value={entrySearch} onFocus={() => setEntryMenuOpen(true)} onChange={(event) => searchEntries(event.target.value)} disabled={selectedExamIds.length === 0} placeholder="Type to search Exams" className="w-full rounded-xl border px-4 py-3 text-sm disabled:bg-slate-100" />{entryMenuOpen && selectedExamIds.length > 0 && <div id="exam-entry-results" role="listbox" className="absolute z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">{visibleGroups.length === 0 ? <p className="px-3 py-3 text-sm text-slate-500">No Exams match this search.</p> : visibleGroups.map((group) => <button key={group.id} type="button" role="option" aria-selected={group.id === examGroupId} onClick={() => { chooseGroup(group.id); setEntrySearch(group.name); setEntryMenuOpen(false); }} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${group.id === examGroupId ? "bg-teal-50 text-teal-800" : "text-slate-700 hover:bg-slate-100"}`}>{group.name}</button>)}</div>}</div>
                {examGroupId && <p className="mt-2 text-xs font-semibold text-teal-800">Selected: {selectedGroupName}</p>}
              </section>

              <label htmlFor="subject_id" className="mt-5 block text-sm font-bold text-slate-800">Subject</label>
              <select id="subject_id" name="subject_id" required value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!examGroupId || visibleSubjects.length === 0} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm disabled:bg-slate-100"><option value="">{!examGroupId ? "Choose an Exam first" : visibleSubjects.length === 0 ? "No subjects found" : "Choose a subject"}</option>{visibleSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
              <p className="mt-3 text-xs leading-5 text-slate-500">{selectedExamNames.length ? `Showing entries for ${selectedExamNames.join(", ")}.` : "No exam selected yet."}</p>

              <fieldset className="mt-6"><legend className="text-sm font-bold text-slate-800">Where can this question be used?</legend><div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3"><label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700"><input name="availability_scope" value="all_exam_entries" type="radio" checked={availabilityScope === "all_exam_entries"} onChange={() => setAvailabilityScope("all_exam_entries")} className="mt-1 h-4 w-4 accent-teal-700" /><span><span className="block font-bold">All Exams under checked categories</span><span className="block text-xs leading-5 text-slate-500">For example, ticking TGPSC makes it available for every TGPSC Exam.</span></span></label><label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700"><input name="availability_scope" value="selected_entry" type="radio" checked={availabilityScope === "selected_entry"} onChange={() => setAvailabilityScope("selected_entry")} className="mt-1 h-4 w-4 accent-teal-700" /><span><span className="block font-bold">Only the selected Exam</span><span className="block text-xs leading-5 text-slate-500">Use it only for {selectedGroupName}.</span></span></label></div></fieldset>

              <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"><input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 accent-teal-700" /><span><span className="block text-sm font-bold text-slate-800">Ready to use</span><span className="block text-xs text-slate-500">Active questions can be assigned to mock tests.</span></span></label>

              <label htmlFor="content_lifecycle" className="mt-6 block text-sm font-bold text-slate-800">Question lifetime</label>
              <select id="content_lifecycle" name="content_lifecycle" value={lifecycle} onChange={(event) => setLifecycle(event.target.value as QuestionLifecycle)} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"><option value="permanent">Permanent - keep in the library</option><option value="review">Review later - verify it on a chosen date</option><option value="expires">Expiring - stop using it in new mocks after a date</option></select>
              {lifecycle === "review" && <label htmlFor="review_on" className="mt-4 block text-sm font-bold text-slate-800">Review on<input id="review_on" name="review_on" type="date" required className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>}
              {lifecycle === "expires" && <label htmlFor="expires_on" className="mt-4 block text-sm font-bold text-slate-800">Stop using after<input id="expires_on" name="expires_on" type="date" required className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Expired questions stay in your records, but cannot be added to new mock tests.</span></label>}

              <div className="mt-6 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-900"><p className="font-bold">Question availability</p><p className="mt-1">{availabilityScope === "all_exam_entries" ? `This question will be available in all Exams under: ${selectedExamNames.length ? selectedExamNames.join(", ") : "tick an exam category above"}.` : `This question will be available only for: ${selectedGroupName}.`}</p></div>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">2. Write the question</p>
              <label htmlFor="question_text" className="mt-4 block text-sm font-bold text-slate-800">Question text</label><textarea id="question_text" name="question_text" rows={4} required placeholder="Write a clear, single-answer question..." className="mt-2 w-full rounded-xl border px-4 py-3 leading-6" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">{[["A", "option_a"], ["B", "option_b"], ["C", "option_c"], ["D", "option_d"]].map(([letter, name]) => <label key={name} className="block text-sm font-bold text-slate-800">Option {letter}<input name={name} required placeholder={`Answer choice ${letter}`} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>)}</div>
              <label htmlFor="correct_answer" className="mt-5 block text-sm font-bold text-slate-800">Correct answer</label><select id="correct_answer" name="correct_answer" required defaultValue="" className="mt-2 w-full rounded-xl border px-4 py-3"><option value="" disabled>Choose the correct option</option><option value="A">Option A</option><option value="B">Option B</option><option value="C">Option C</option><option value="D">Option D</option></select>
            </section>
          </div>

          <details className="mt-6 rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer text-sm font-bold text-slate-800">Add explanation, source, or image (optional)</summary><div className="mt-5 grid gap-5 md:grid-cols-2"><label htmlFor="explanation" className="block text-sm font-bold text-slate-800 md:col-span-2">Explanation<textarea id="explanation" name="explanation" rows={3} placeholder="Explain why the selected option is correct..." className="mt-2 w-full rounded-xl border px-4 py-3 font-normal leading-6" /></label><label htmlFor="source_reference" className="block text-sm font-bold text-slate-800">Source reference<input id="source_reference" name="source_reference" placeholder="Book, Act, website, etc." className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label><label htmlFor="image_url" className="block text-sm font-bold text-slate-800">Image URL<input id="image_url" name="image_url" type="url" placeholder="https://" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label></div></details>

          <div className="mt-6 flex flex-wrap items-center gap-4"><button type="submit" disabled={pending || !subjectId} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Saving question..." : "Save question"}</button><p className="text-sm text-slate-500">You can edit it later or assign it to a mock test.</p></div>
          {state.message && <p aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{state.message}</p>}
        </form>
      )}
    </section>
  );
}
