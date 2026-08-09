"use client";

import { useMemo, useState } from "react";
import { CreateSubjectForm } from "./CreateSubjectForm";
import { ExistingSubjectsTable } from "./ExistingSubjectsTable";
import type { SubjectContentLanguageMode } from "@/types/subject";

type Category = { id: string; name: string };
type Exam = { id: string; exam_id: string; name: string };
type Specialization = { id: string; examId: string; name: string };
type Paper = { id: string; exam_group_id: string; specialization_id: string | null; name: string };
type Subject = { id: string; paperId: string; name: string; slug: string; contentLanguageMode: SubjectContentLanguageMode; isActive: boolean };
type Location = { categoryId: string; examId: string; specializationId: string; paperId: string };

const emptyLocation: Location = { categoryId: "", examId: "", specializationId: "", paperId: "" };

export function SubjectsWorkspace({ categories, exams, specializations, papers, subjects }: { categories: Category[]; exams: Exam[]; specializations: Specialization[]; papers: Paper[]; subjects: Subject[] }) {
  const [location, setLocation] = useState(emptyLocation);
  const categoryName = useMemo(() => categories.find((category) => category.id === location.categoryId)?.name ?? null, [categories, location.categoryId]);
  const examName = useMemo(() => exams.find((exam) => exam.id === location.examId)?.name ?? null, [exams, location.examId]);
  const specializationName = useMemo(() => specializations.find((specialization) => specialization.id === location.specializationId)?.name ?? null, [location.specializationId, specializations]);
  const paperName = useMemo(() => papers.find((paper) => paper.id === location.paperId)?.name ?? null, [papers, location.paperId]);

  return <><CreateSubjectForm categories={categories} exams={exams} specializations={specializations} papers={papers} onLocationChange={setLocation} /><ExistingSubjectsTable categoryName={categoryName} examName={examName} specializationName={specializationName} paperId={location.paperId} paperName={paperName} subjects={subjects} /></>;
}
