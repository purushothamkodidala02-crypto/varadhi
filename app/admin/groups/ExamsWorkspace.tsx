"use client";

import { useMemo, useState } from "react";
import { CreateGroupForm } from "./CreateGroupForm";
import { ExistingExamsTable } from "./ExistingExamsTable";

type Category = { id: string; name: string };
type Exam = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
};

export function ExamsWorkspace({
  categories,
  exams,
}: {
  categories: Category[];
  exams: Exam[];
}) {
  const [categoryId, setCategoryId] = useState("");
  const categoryName = useMemo(
    () => categories.find((category) => category.id === categoryId)?.name ?? null,
    [categories, categoryId],
  );

  return (
    <>
      <CreateGroupForm exams={categories} onExamCategoryChange={setCategoryId} />
      <ExistingExamsTable
        categoryId={categoryId}
        categoryName={categoryName}
        exams={exams}
      />
    </>
  );
}
