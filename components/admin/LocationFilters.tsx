"use client";

import { useMemo } from "react";
import { SearchableSelect } from "./SearchableSelect";

export type LocationCategory = { id: string; name: string };
export type LocationExam = { id: string; categoryId: string; name: string };
export type LocationSpecialization = { id: string; examId: string; name: string };
export type LocationPaper = { id: string; examId: string; specializationId: string | null; name: string };
export type LocationSubject = { id: string; paperId: string; name: string };

export type LocationFilterValue = { categoryId: string; examId: string; specializationId: string; paperId: string; subjectId: string };

type LocationFiltersProps = {
  categories: LocationCategory[];
  exams: LocationExam[];
  specializations?: LocationSpecialization[];
  papers: LocationPaper[];
  subjects?: LocationSubject[];
  value: LocationFilterValue;
  onChange: (value: LocationFilterValue) => void;
  includeSubjects?: boolean;
};

export function LocationFilters({ categories, exams, specializations = [], papers, subjects = [], value, onChange, includeSubjects = false }: LocationFiltersProps) {
  const availableExams = useMemo(() => exams.filter((exam) => exam.categoryId === value.categoryId), [exams, value.categoryId]);
  const availableSpecializations = useMemo(() => specializations.filter((specialization) => specialization.examId === value.examId), [specializations, value.examId]);
  const availablePapers = useMemo(() => papers.filter((paper) => paper.examId === value.examId && (value.specializationId ? paper.specializationId === value.specializationId : !paper.specializationId)), [papers, value.examId, value.specializationId]);
  const availableSubjects = useMemo(() => subjects.filter((subject) => subject.paperId === value.paperId), [subjects, value.paperId]);
  const columns = includeSubjects ? "xl:grid-cols-5" : "lg:grid-cols-4";

  return <div className={`grid gap-3 ${columns}`}><label className="block text-sm font-bold">Exam Category<SearchableSelect value={value.categoryId} onChange={(categoryId) => onChange({ categoryId, examId: "", specializationId: "", paperId: "", subjectId: "" })} options={categories.map((category) => ({ value: category.id, label: category.name }))} placeholder="Search a category" /></label><label className="block text-sm font-bold">Exam<SearchableSelect value={value.examId} onChange={(examId) => onChange({ ...value, examId, specializationId: "", paperId: "", subjectId: "" })} options={availableExams.map((exam) => ({ value: exam.id, label: exam.name }))} placeholder="Search an Exam" disabled={!value.categoryId} emptyMessage="No Exams in this category." /></label><label className="block text-sm font-bold">Specialisation <span className="font-normal text-slate-500">(optional)</span><SearchableSelect value={value.specializationId} onChange={(specializationId) => onChange({ ...value, specializationId, paperId: "", subjectId: "" })} options={[{ value: "", label: availableSpecializations.length ? "No specialisation — direct Papers" : "No specialisation" }, ...availableSpecializations.map((specialization) => ({ value: specialization.id, label: specialization.name }))]} placeholder="Choose a Specialisation" disabled={!value.examId} emptyMessage="No Specialisations in this Exam." /></label><label className="block text-sm font-bold">Paper<SearchableSelect value={value.paperId} onChange={(paperId) => onChange({ ...value, paperId, subjectId: "" })} options={availablePapers.map((paper) => ({ value: paper.id, label: paper.name }))} placeholder="Search a Paper" disabled={!value.examId} emptyMessage="No Papers in this selection." /></label>{includeSubjects && <label className="block text-sm font-bold">Subject<SearchableSelect value={value.subjectId} onChange={(subjectId) => onChange({ ...value, subjectId })} options={availableSubjects.map((subject) => ({ value: subject.id, label: subject.name }))} placeholder="Search a Subject" disabled={!value.paperId} emptyMessage="No Subjects in this Paper." /></label>}</div>;
}
