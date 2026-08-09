"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { createSubjects, type CreateSubjectState } from "./actions";
import { SubjectListInput } from "./SubjectListInput";

type Category = { id: string; name: string };
type Exam = { id: string; exam_id: string; name: string };
type Specialization = { id: string; examId: string; name: string };
type Paper = { id: string; exam_group_id: string; specialization_id: string | null; name: string };
type SubjectLocation = { categoryId: string; examId: string; specializationId: string; paperId: string };

const initialState: CreateSubjectState = { success: false, message: "" };

export function CreateSubjectForm({
  categories,
  exams,
  specializations,
  papers,
  onLocationChange,
}: {
  categories: Category[];
  exams: Exam[];
  specializations: Specialization[];
  papers: Paper[];
  onLocationChange?: (location: SubjectLocation) => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [examId, setExamId] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [paperId, setPaperId] = useState("");
  const [subjectResetKey, setSubjectResetKey] = useState(0);
  const [state, formAction, pending] = useActionState(createSubjects, initialState);

  const availableExams = useMemo(
    () => exams.filter((exam) => exam.exam_id === categoryId),
    [categoryId, exams],
  );
  const availableSpecializations = useMemo(
    () => specializations.filter((specialization) => specialization.examId === examId),
    [examId, specializations],
  );
  const availablePapers = useMemo(
    () => papers.filter((paper) => paper.exam_group_id === examId && (specializationId ? paper.specialization_id === specializationId : !paper.specialization_id)),
    [examId, papers, specializationId],
  );

  useEffect(() => {
    if (state.success) setSubjectResetKey((current) => current + 1);
  }, [state]);

  function changeCategory(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    setExamId("");
    setSpecializationId("");
    setPaperId("");
    onLocationChange?.({ categoryId: nextCategoryId, examId: "", specializationId: "", paperId: "" });
  }

  function changeExam(nextExamId: string) {
    setExamId(nextExamId);
    setSpecializationId("");
    setPaperId("");
    onLocationChange?.({ categoryId, examId: nextExamId, specializationId: "", paperId: "" });
  }

  function changeSpecialization(nextSpecializationId: string) {
    setSpecializationId(nextSpecializationId);
    setPaperId("");
    onLocationChange?.({ categoryId, examId, specializationId: nextSpecializationId, paperId: "" });
  }

  function changePaper(nextPaperId: string) {
    setPaperId(nextPaperId);
    onLocationChange?.({ categoryId, examId, specializationId, paperId: nextPaperId });
  }

  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Add Subjects</h2>
      <p className="mt-1 text-sm text-slate-600">
        First choose where the Subjects belong, including a Specialisation when this Exam has branches.
      </p>

      <form action={formAction} className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-bold">
            Exam Category
            <SearchableSelect name="exam_category_id" value={categoryId} onChange={changeCategory} options={categories.map((category) => ({ value: category.id, label: category.name }))} placeholder="Search and choose a category" />
          </label>
          <label className="block text-sm font-bold">
            Exam
            <SearchableSelect name="exam_group_id" value={examId} onChange={changeExam} options={availableExams.map((exam) => ({ value: exam.id, label: exam.name }))} placeholder="Search and choose an Exam" disabled={!categoryId} emptyMessage="No Exams in this category." />
          </label>
          <label className="block text-sm font-bold">
            Specialisation <span className="font-normal text-slate-500">(optional)</span>
            <SearchableSelect value={specializationId} onChange={changeSpecialization} options={[{ value: "", label: availableSpecializations.length ? "No specialisation — direct Papers" : "No specialisation" }, ...availableSpecializations.map((specialization) => ({ value: specialization.id, label: specialization.name }))]} placeholder="Choose a Specialisation" disabled={!examId} emptyMessage="No Specialisations in this Exam." />
          </label>
          <label className="block text-sm font-bold">
            Paper
            <SearchableSelect name="paper_id" value={paperId} onChange={changePaper} options={availablePapers.map((paper) => ({ value: paper.id, label: paper.name }))} placeholder="Search and choose a Paper" disabled={!examId} emptyMessage="No Papers in this selection." />
          </label>
        </div>

        <SubjectListInput resetKey={subjectResetKey} />

        <button disabled={pending || !paperId} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
          {pending ? "Adding..." : "Add Subjects"}
        </button>
        {state.message && <p aria-live="polite" className={`text-sm font-semibold ${state.success ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>}
      </form>
    </section>
  );
}
