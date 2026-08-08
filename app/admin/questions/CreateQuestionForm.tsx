"use client";

import { useActionState, useMemo, useState } from "react";
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
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [examGroupId, setExamGroupId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [entrySearch, setEntrySearch] = useState("");
  const hasSubjects = subjects.length > 0;

  const visibleGroups = useMemo(() => {
    const query = entrySearch.trim().toLowerCase();
    return groups.filter((group) => selectedExamIds.includes(group.examId) && (!query || group.name.toLowerCase().includes(query)));
  }, [entrySearch, groups, selectedExamIds]);
  const visibleSubjects = useMemo(() => subjects.filter((subject) => subject.examGroupId === examGroupId), [examGroupId, subjects]);
  const selectedExamNames = exams.filter((exam) => selectedExamIds.includes(exam.id)).map((exam) => exam.name);

  function chooseGroup(nextGroupId: string) {
    setExamGroupId(nextGroupId);
    setSubjectId(subjects.find((subject) => subject.examGroupId === nextGroupId)?.id ?? "");
  }

  function toggleExam(nextExamId: string, checked: boolean) {
    const nextExamIds = checked ? Array.from(new Set([...selectedExamIds, nextExamId])) : selectedExamIds.filter((id) => id !== nextExamId);
    const currentGroupIsVisible = groups.some((group) => group.id === examGroupId && nextExamIds.includes(group.examId));
    const nextGroupId = currentGroupIsVisible ? examGroupId : groups.find((group) => nextExamIds.includes(group.examId))?.id ?? "";
    setSelectedExamIds(nextExamIds);
    setEntrySearch("");
    if (nextGroupId !== examGroupId) chooseGroup(nextGroupId);
  }

  function searchEntries(nextSearch: string) {
    const query = nextSearch.trim().toLowerCase();
    const matchingGroups = groups.filter((group) => selectedExamIds.includes(group.examId) && (!query || group.name.toLowerCase().includes(query)));
    setEntrySearch(nextSearch);
    if (!matchingGroups.some((group) => group.id === examGroupId)) chooseGroup(matchingGroups[0]?.id ?? "");
  }

  return (
    <section id="add-question" className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">New question</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Add a question to your library</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Tick the exam first. Then choose one of its exam entries and the matching subject.</p>
      </div>

      {!hasSubjects ? <div className="p-7"><p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Add an exam, exam entry, and subject before creating questions.</p></div> : (
        <form action={formAction} className="p-6 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">1. Choose where it belongs</p>

              <fieldset className="mt-4"><legend className="text-sm font-bold text-slate-800">Choose exam</legend><p className="mt-1 text-xs leading-5 text-slate-500">Tick TGPSC, TET, or another exam. The entry dropdown below will show only entries from your selection.</p><div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3">{exams.map((exam) => <label key={exam.id} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={selectedExamIds.includes(exam.id)} onChange={(event) => toggleExam(exam.id, event.target.checked)} className="h-4 w-4 accent-teal-700" />{exam.name}</label>)}</div></fieldset>

              <label htmlFor="entry_search" className="mt-5 block text-sm font-bold text-slate-800">Find an exam entry</label>
              <input id="entry_search" type="search" value={entrySearch} onChange={(event) => searchEntries(event.target.value)} disabled={selectedExamIds.length === 0} placeholder="Tick an exam above, then search its entries" className="mt-2 w-full rounded-xl border px-4 py-3 text-sm disabled:bg-slate-100" />

              <label htmlFor="exam_group_id" className="mt-5 block text-sm font-bold text-slate-800">Exam entry</label>
              <select id="exam_group_id" value={examGroupId} onChange={(event) => chooseGroup(event.target.value)} disabled={selectedExamIds.length === 0 || visibleGroups.length === 0} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm disabled:bg-slate-100"><option value="">{selectedExamIds.length === 0 ? "Tick an exam first" : visibleGroups.length === 0 ? "No entries found" : "Choose an exam entry"}</option>{visibleGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>

              <label htmlFor="subject_id" className="mt-5 block text-sm font-bold text-slate-800">Subject</label>
              <select id="subject_id" name="subject_id" required value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!examGroupId || visibleSubjects.length === 0} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm disabled:bg-slate-100"><option value="">{!examGroupId ? "Choose an exam entry first" : visibleSubjects.length === 0 ? "No subjects found" : "Choose a subject"}</option>{visibleSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
              <p className="mt-3 text-xs leading-5 text-slate-500">{selectedExamNames.length ? `Showing entries for ${selectedExamNames.join(", ")}.` : "No exam selected yet."}</p>

              <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"><input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 accent-teal-700" /><span><span className="block text-sm font-bold text-slate-800">Ready to use</span><span className="block text-xs text-slate-500">Active questions can be assigned to mock tests.</span></span></label>

              <label htmlFor="content_lifecycle" className="mt-6 block text-sm font-bold text-slate-800">Question lifetime</label>
              <select id="content_lifecycle" name="content_lifecycle" value={lifecycle} onChange={(event) => setLifecycle(event.target.value as QuestionLifecycle)} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"><option value="permanent">Permanent - keep in the library</option><option value="review">Review later - verify it on a chosen date</option><option value="expires">Expiring - stop using it in new mocks after a date</option></select>
              {lifecycle === "review" && <label htmlFor="review_on" className="mt-4 block text-sm font-bold text-slate-800">Review on<input id="review_on" name="review_on" type="date" required className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>}
              {lifecycle === "expires" && <label htmlFor="expires_on" className="mt-4 block text-sm font-bold text-slate-800">Stop using after<input id="expires_on" name="expires_on" type="date" required className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Expired questions stay in your records, but cannot be added to new mock tests.</span></label>}

              <fieldset className="mt-6"><legend className="text-sm font-bold text-slate-800">Also suitable for</legend><p className="mt-1 text-xs leading-5 text-slate-500">Choose any other relevant entries from the exams you ticked. The main entry is included automatically.</p><div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">{visibleGroups.map((group) => <label key={group.id} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700"><input name="exam_group_ids" type="checkbox" value={group.id} disabled={group.id === examGroupId} className="mt-1 h-4 w-4 accent-teal-700 disabled:opacity-40" /><span>{group.name}{group.id === examGroupId ? " (main entry)" : ""}</span></label>)}</div></fieldset>
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
