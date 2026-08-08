"use client";

import { useMemo } from "react";
import { SearchableSelect } from "./SearchableSelect";

export type LocationCategory = { id: string; name: string };
export type LocationExam = { id: string; categoryId: string; name: string };
export type LocationPaper = { id: string; examId: string; name: string };
export type LocationSubject = { id: string; paperId: string; name: string };

export type LocationFilterValue = {
  categoryId: string;
  examId: string;
  paperId: string;
  subjectId: string;
};

type LocationFiltersProps = {
  categories: LocationCategory[];
  exams: LocationExam[];
  papers: LocationPaper[];
  subjects?: LocationSubject[];
  value: LocationFilterValue;
  onChange: (value: LocationFilterValue) => void;
  includeSubjects?: boolean;
};

export function LocationFilters({
  categories,
  exams,
  papers,
  subjects = [],
  value,
  onChange,
  includeSubjects = false,
}: LocationFiltersProps) {
  const availableExams = useMemo(
    () => exams.filter((exam) => exam.categoryId === value.categoryId),
    [exams, value.categoryId],
  );
  const availablePapers = useMemo(
    () => papers.filter((paper) => paper.examId === value.examId),
    [papers, value.examId],
  );
  const availableSubjects = useMemo(
    () => subjects.filter((subject) => subject.paperId === value.paperId),
    [subjects, value.paperId],
  );

  return (
    <div className={`grid gap-3 ${includeSubjects ? "lg:grid-cols-4" : "md:grid-cols-3"}`}>
      <label className="block text-sm font-bold">
        Exam Category
        <SearchableSelect
          value={value.categoryId}
          onChange={(categoryId) =>
            onChange({ categoryId, examId: "", paperId: "", subjectId: "" })
          }
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          placeholder="Search a category"
        />
      </label>
      <label className="block text-sm font-bold">
        Exam
        <SearchableSelect
          value={value.examId}
          onChange={(examId) =>
            onChange({ ...value, examId, paperId: "", subjectId: "" })
          }
          options={availableExams.map((exam) => ({ value: exam.id, label: exam.name }))}
          placeholder="Search an Exam"
          disabled={!value.categoryId}
          emptyMessage="No Exams in this category."
        />
      </label>
      <label className="block text-sm font-bold">
        Paper
        <SearchableSelect
          value={value.paperId}
          onChange={(paperId) => onChange({ ...value, paperId, subjectId: "" })}
          options={availablePapers.map((paper) => ({ value: paper.id, label: paper.name }))}
          placeholder="Search a Paper"
          disabled={!value.examId}
          emptyMessage="No Papers in this Exam."
        />
      </label>
      {includeSubjects && (
        <label className="block text-sm font-bold">
          Subject
          <SearchableSelect
            value={value.subjectId}
            onChange={(subjectId) => onChange({ ...value, subjectId })}
            options={availableSubjects.map((subject) => ({
              value: subject.id,
              label: subject.name,
            }))}
            placeholder="Search a Subject"
            disabled={!value.paperId}
            emptyMessage="No Subjects in this Paper."
          />
        </label>
      )}
    </div>
  );
}
