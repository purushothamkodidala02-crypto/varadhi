"use client";

import { useMemo, useState } from "react";
import { CreateSubjectForm } from "./CreateSubjectForm";
import { ExistingSubjectsTable } from "./ExistingSubjectsTable";

type Category = { id: string; name: string };
type Exam = { id: string; exam_id: string; name: string };
type Paper = { id: string; exam_group_id: string; name: string };
type Subject = { id: string; paperId: string; name: string; slug: string; isActive: boolean };
type Location = { categoryId: string; examId: string; paperId: string };

const emptyLocation: Location = { categoryId: "", examId: "", paperId: "" };

export function SubjectsWorkspace({
  categories,
  exams,
  papers,
  subjects,
}: {
  categories: Category[];
  exams: Exam[];
  papers: Paper[];
  subjects: Subject[];
}) {
  const [location, setLocation] = useState(emptyLocation);
  const categoryName = useMemo(
    () => categories.find((category) => category.id === location.categoryId)?.name ?? null,
    [categories, location.categoryId],
  );
  const examName = useMemo(
    () => exams.find((exam) => exam.id === location.examId)?.name ?? null,
    [exams, location.examId],
  );
  const paperName = useMemo(
    () => papers.find((paper) => paper.id === location.paperId)?.name ?? null,
    [papers, location.paperId],
  );

  return (
    <>
      <CreateSubjectForm
        categories={categories}
        exams={exams}
        papers={papers}
        onLocationChange={setLocation}
      />
      <ExistingSubjectsTable
        categoryName={categoryName}
        examName={examName}
        paperId={location.paperId}
        paperName={paperName}
        subjects={subjects}
      />
    </>
  );
}
