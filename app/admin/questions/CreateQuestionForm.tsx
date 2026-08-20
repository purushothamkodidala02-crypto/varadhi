"use client";

import { useActionState, useMemo, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { QuestionImageField } from "@/components/admin/QuestionImageField";
import type { QuestionLifecycle } from "@/types/question";
import type { SubjectContentLanguageMode } from "@/types/subject";
import { createQuestion, type CreateQuestionState } from "./actions";

type Category = { id: string; name: string };
type Exam = { id: string; categoryId: string; name: string };
type Specialization = { id: string; examId: string; name: string };
type Paper = { id: string; examId: string; specializationId: string | null; name: string };
type Subject = {
  id: string;
  paperId: string;
  name: string;
  contentLanguageMode: SubjectContentLanguageMode;
};

const initialState: CreateQuestionState = { success: false, message: "" };

export function CreateQuestionForm({
  categories,
  exams,
  specializations,
  papers,
  subjects,
}: {
  categories: Category[];
  exams: Exam[];
  specializations: Specialization[];
  papers: Paper[];
  subjects: Subject[];
}) {
  const [state, action, pending] = useActionState(createQuestion, initialState);
  const [categoryId, setCategoryId] = useState("");
  const [examId, setExamId] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [paperId, setPaperId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [lifecycle, setLifecycle] = useState<QuestionLifecycle | "">("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  const visibleExams = useMemo(
    () => exams.filter((exam) => exam.categoryId === categoryId),
    [exams, categoryId],
  );
  const visibleSpecializations = useMemo(
    () => specializations.filter((item) => item.examId === examId),
    [specializations, examId],
  );
  const visiblePapers = useMemo(
    () =>
      papers.filter(
        (paper) =>
          paper.examId === examId &&
          (specializationId
            ? paper.specializationId === specializationId
            : !paper.specializationId),
      ),
    [papers, examId, specializationId],
  );
  const visibleSubjects = useMemo(
    () => subjects.filter((subject) => subject.paperId === paperId),
    [subjects, paperId],
  );
  const languageMode = useMemo(
    () =>
      subjects.find((subject) => subject.id === subjectId)?.contentLanguageMode ??
      null,
    [subjectId, subjects],
  );

  function changeCategory(value: string) {
    setCategoryId(value);
    setExamId("");
    setSpecializationId("");
    setPaperId("");
    setSubjectId("");
  }
  function changeExam(value: string) {
    setExamId(value);
    setSpecializationId("");
    setPaperId("");
    setSubjectId("");
  }
  function changeSpecialization(value: string) {
    setSpecializationId(value);
    setPaperId("");
    setSubjectId("");
  }
  function changePaper(value: string) {
    setPaperId(value);
    setSubjectId("");
  }

  return (
    <section id="add-question" className="mt-8 scroll-mt-24 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="border-b bg-slate-50 px-7 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">New question</p>
        <h2 className="mt-2 text-2xl font-black">Classify, then add the question</h2>
        <p className="mt-2 text-sm text-slate-600">The selected Subject automatically decides whether English, Telugu, or both are required.</p>
      </div>
      <form action={action} className="p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">1. Question location</p>
            <div className="mt-4 space-y-4">
              <SelectField label="Exam Category" name="exam_id" value={categoryId} onChange={changeCategory} options={categories.map((item) => ({ value: item.id, label: item.name }))} placeholder="Search and choose a category" />
              <SelectField label="Exam" name="exam_group_id" value={examId} onChange={changeExam} options={visibleExams.map((item) => ({ value: item.id, label: item.name }))} placeholder="Search and choose an Exam" disabled={!categoryId} />
              <SelectField label="Specialisation (optional)" value={specializationId} onChange={changeSpecialization} options={[{ value: "", label: visibleSpecializations.length ? "No specialisation — direct Papers" : "No specialisation" }, ...visibleSpecializations.map((item) => ({ value: item.id, label: item.name }))]} placeholder="Choose a Specialisation" disabled={!examId} />
              <SelectField label="Paper" name="paper_id" value={paperId} onChange={changePaper} options={visiblePapers.map((item) => ({ value: item.id, label: item.name }))} placeholder="Search and choose a Paper" disabled={!examId} />
              <SelectField label="Subject" name="subject_id" value={subjectId} onChange={setSubjectId} options={visibleSubjects.map((item) => ({ value: item.id, label: item.name }))} placeholder="Search and choose a Subject" disabled={!paperId} />
            </div>
            {languageMode && (
              <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-950">
                <span className="font-black">Required: </span>
                {languageMode === "bilingual" ? "English + Telugu" : languageMode === "telugu" ? "Telugu only" : "English only"}
              </div>
            )}
            <label className="mt-5 block text-sm font-bold">
              Question lifetime
              <SearchableSelect name="content_lifecycle" value={lifecycle} onChange={(value) => setLifecycle(value as QuestionLifecycle | "")} options={[{ value: "permanent", label: "Permanent" }, { value: "review", label: "Review later" }, { value: "expires", label: "Expire after a date" }]} placeholder="Choose a lifetime" />
            </label>
            {lifecycle === "review" && <label className="mt-4 block text-sm font-bold">Review on<input name="review_on" type="date" required className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>}
            {lifecycle === "expires" && <label className="mt-4 block text-sm font-bold">Stop using after<input name="expires_on" type="date" required className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>}
            <label className="mt-5 flex items-center gap-3 rounded-xl border bg-white p-3 text-sm font-bold"><input name="is_active" type="checkbox" defaultChecked className="h-4 w-4" />Ready to use in mock tests</label>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">2. Question content</p>
            {!languageMode ? (
              <div className="mt-4 rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">Choose a Subject to open the correct language fields.</div>
            ) : (
              <div className="mt-4 space-y-5">
                {languageMode !== "telugu" && <LanguageFields language="English" suffix="" />}
                {languageMode !== "english" && <LanguageFields language="తెలుగు" suffix="_te" lang="te" />}
                <QuestionImageField />
                <label className="block text-sm font-bold">Correct answer<SearchableSelect name="correct_answer" value={correctAnswer} onChange={setCorrectAnswer} options={["A", "B", "C", "D"].map((letter) => ({ value: letter, label: `Option ${letter}` }))} placeholder="Choose the correct option" /></label>
                <label className="block text-sm font-bold">Source reference <span className="font-normal text-slate-500">(optional)</span><input name="source_reference" placeholder="For example: TGPSC Group 2 Paper I, 2025" className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" /></label>
              </div>
            )}
          </section>
        </div>
        <div className="mt-6">
          <button disabled={pending || !subjectId || !lifecycle || !correctAnswer} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving..." : "Save Question"}</button>
          {state.message && <p className={`mt-4 text-sm font-semibold ${state.success ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>}
        </div>
      </form>
    </section>
  );
}

function SelectField(props: { label: string; name?: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder: string; disabled?: boolean }) {
  return <label className="block text-sm font-bold">{props.label}<SearchableSelect {...props} /></label>;
}

function LanguageFields({ language, suffix, lang }: { language: string; suffix: "" | "_te"; lang?: string }) {
  return (
    <fieldset lang={lang} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <legend className="px-2 text-sm font-black text-slate-950">{language}</legend>
      <label className="block text-sm font-bold">Question<textarea name={`question_text${suffix}`} required rows={5} placeholder={suffix ? "ప్రశ్నను తెలుగులో నమోదు చేయండి" : "Type the question in English"} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal leading-7" /></label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {["A", "B", "C", "D"].map((letter) => <label key={letter} className="block text-sm font-bold">Option {letter}<textarea name={`option_${letter.toLowerCase()}${suffix}`} required rows={2} className="mt-2 w-full resize-y rounded-xl border bg-white px-4 py-3 font-normal leading-6" /></label>)}
      </div>
      <label className="mt-4 block text-sm font-bold">Explanation <span className="font-normal text-slate-500">(optional)</span><textarea name={`explanation${suffix}`} rows={3} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal leading-6" /></label>
    </fieldset>
  );
}
