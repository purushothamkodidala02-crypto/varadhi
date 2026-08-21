"use client";

import Link from "next/link";
import { useState } from "react";
import { DeletePaperButton } from "@/app/admin/papers/DeletePaperButton";
import { DeleteSpecializationButton } from "@/app/admin/specializations/DeleteSpecializationButton";
import { DeleteSubjectButton } from "@/app/admin/subjects/DeleteSubjectButton";
import { CreateGroupForm } from "@/app/admin/groups/CreateGroupForm";
import { DeleteGroupButton } from "@/app/admin/groups/DeleteGroupButton";
import { ExamSymbol, StateSymbol } from "@/components/exams/CatalogSymbols";
import { CreateExamForm } from "./CreateExamForm";
import { DeleteExamButton } from "./DeleteExamButton";
import { StateManager } from "./StateManager";

type ExamState = {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  displayOrder: number;
};

type Category = {
  id: string;
  stateId: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
};

type Exam = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
};

type Specialization = {
  id: string;
  examId: string;
  name: string;
  isActive: boolean;
};

type Paper = {
  id: string;
  examId: string;
  specializationId: string | null;
  name: string;
  isActive: boolean;
};

type Subject = {
  id: string;
  paperId: string;
  name: string;
  isActive: boolean;
};

function stateCategoriesFor(categories: Category[], stateId: string) {
  return categories.filter((category) => category.stateId === stateId);
}

export function ExamStructureWorkspace({
  states,
  categories,
  exams,
  specializations,
  papers,
  subjects,
}: {
  states: ExamState[];
  categories: Category[];
  exams: Exam[];
  specializations: Specialization[];
  papers: Paper[];
  subjects: Subject[];
}) {
  const [selectedStateId, setSelectedStateId] = useState(states[0]?.id ?? "");
  const resolvedStateId = states.some((state) => state.id === selectedStateId)
    ? selectedStateId
    : (states[0]?.id ?? "");
  const selectedState = states.find((state) => state.id === resolvedStateId);
  const stateCategories = categories.filter((category) => category.stateId === resolvedStateId);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    stateCategories[0]?.id ?? "",
  );
  const [search, setSearch] = useState("");
  const resolvedCategoryId = stateCategories.some(
    (category) => category.id === selectedCategoryId,
  )
    ? selectedCategoryId
    : (stateCategories[0]?.id ?? "");
  const selectedCategory = stateCategories.find(
    (category) => category.id === resolvedCategoryId,
  );
  const query = search.trim().toLowerCase();
  const visibleExams = exams.filter(
    (exam) =>
      exam.categoryId === resolvedCategoryId &&
      (!query || `${exam.name} ${exam.slug}`.toLowerCase().includes(query)),
  );

  return (
    <div className="mt-8 space-y-6">
      <StateManager states={states.map((state) => ({
        ...state,
        categoryCount: categories.filter((category) => category.stateId === state.id).length,
      }))} />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-6 py-5 sm:px-7">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">Step 1 · Exam location</p>
          <h2 className="font-display mt-2 text-xl">Choose the state workspace</h2>
          <p className="mt-1 text-sm text-slate-600">Only boards and exams from the selected location appear below.</p>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-3 sm:p-7">{states.map((state) => {
          const active = state.id === resolvedStateId;
          const stateExams = exams.filter((exam) => categories.some((category) => category.id === exam.categoryId && category.stateId === state.id));
          return <button key={state.id} type="button" onClick={() => { setSelectedStateId(state.id); setSelectedCategoryId(categories.find((category) => category.stateId === state.id)?.id ?? ""); setSearch(""); }} className={`rounded-2xl border p-5 text-left transition ${active ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500" : "hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"}`}>
            <span className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-xl ${active ? "bg-slate-950 text-teal-200" : "bg-slate-100 text-slate-700"}`}><StateSymbol slug={state.slug} /></span><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{state.code}</span></span>
            <strong className="font-display mt-4 block text-lg">{state.name}</strong>
            <span className="mt-1 block text-xs font-semibold text-slate-500">{stateCategoriesFor(categories, state.id).length} boards · {stateExams.length} exams</span>
          </button>;
        })}</div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm">
        <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 via-white to-white px-6 py-5 sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Step 2 · Choose a board
          </p>
          <h2 className="font-display mt-2 text-xl">Boards in {selectedState?.name ?? "this state"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Select a category to manage only the Exams and content that belong to it.
          </p>
        </div>

        {stateCategories.length === 0 ? (
          <div className="p-7 text-sm text-slate-600">
            Add your first Exam Category below to begin.
          </div>
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:p-7">
            {stateCategories.map((category) => {
              const categoryExams = exams.filter(
                (exam) => exam.categoryId === category.id,
              );
              const active = resolvedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setSearch("");
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-teal-200">
                      <ExamSymbol name={category.name} className="h-5 w-5" />
                    </span>
                    <Status active={category.isActive} />
                  </span>
                  <span className="mt-4 block font-black text-slate-950">
                    {category.name}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">
                    {categoryExams.length} {categoryExams.length === 1 ? "Exam" : "Exams"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <details className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              New top-level item
            </p>
            <h2 className="mt-2 font-black text-slate-950">+ Add Exam Category</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add another board such as TGPSC, DSC, TET, or Police Recruitment.
            </p>
          </summary>
          <div className="border-t bg-slate-50 p-5 [&>section]:mt-0 [&>section]:bg-white">
            <CreateExamForm
              states={states.map((state) => ({ id: state.id, name: state.name, code: state.code }))}
              initialStateId={resolvedStateId}
              existingCategories={categories.map((category) => ({
                id: category.id,
                stateId: category.stateId,
                name: category.name,
              }))}
            />
          </div>
        </details>

        <details
          className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${selectedCategory ? "border-teal-200" : "border-slate-200"}`}
        >
          <summary
            className={`list-none px-6 py-5 ${selectedCategory ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
              New Exam
            </p>
            <h2 className="mt-2 font-black text-slate-950">
              + Add Exam{selectedCategory ? ` under ${selectedCategory.name}` : ""}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Create its Specialisations and Papers together in one setup.
            </p>
          </summary>
          {selectedCategory && (
            <div className="border-t border-teal-100 bg-teal-50/40 p-5 [&>section]:mt-0">
              <CreateGroupForm
                key={selectedCategory.id}
                categories={stateCategories.map((category) => ({
                  id: category.id,
                  name: category.name,
                }))}
                existingExams={exams.map((exam) => ({
                  id: exam.id,
                  categoryId: exam.categoryId,
                  name: exam.name,
                  slug: exam.slug,
                }))}
                initialCategoryId={selectedCategory.id}
              />
            </div>
          )}
        </details>
      </section>

      {selectedCategory && (
        <section className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-lg shadow-slate-950/[0.04]">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-teal-100 bg-gradient-to-r from-slate-950 to-teal-950 px-6 py-6 text-white sm:px-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-200">
                Selected category
              </p>
              <h2 className="mt-2 text-2xl font-black">{selectedCategory.name}</h2>
              <p className="mt-1 text-sm text-slate-300">
                {selectedCategory.slug} · Order {selectedCategory.displayOrder}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/admin/exams/${selectedCategory.id}/edit`}
                className="rounded-lg bg-teal-300 px-3 py-2 text-sm font-black text-slate-950 hover:bg-teal-200"
              >
                Edit category
              </Link>
              <div className="rounded-lg bg-white px-3 py-2">
                <DeleteExamButton
                  examId={selectedCategory.id}
                  examName={selectedCategory.name}
                />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-slate-50 px-6 py-5 sm:px-7">
            <label className="block max-w-xl text-sm font-bold text-slate-800">
              Find an Exam inside {selectedCategory.name}
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="For example: Group 2, AEE, School Assistant"
                className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal"
              />
            </label>
          </div>

          {visibleExams.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="font-black text-slate-950">No matching Exams</h3>
              <p className="mt-2 text-sm text-slate-600">
                Add an Exam above or change the search.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-5 sm:p-7">
              {visibleExams.map((exam, index) => (
                <ExamBranch
                  key={exam.id}
                  exam={exam}
                  categoryId={selectedCategory.id}
                  specializations={specializations.filter(
                    (item) => item.examId === exam.id,
                  )}
                  papers={papers.filter((paper) => paper.examId === exam.id)}
                  subjects={subjects}
                  defaultOpen={index === 0}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ExamBranch({
  exam,
  categoryId,
  specializations,
  papers,
  subjects,
  defaultOpen,
}: {
  exam: Exam;
  categoryId: string;
  specializations: Specialization[];
  papers: Paper[];
  subjects: Subject[];
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const examSubjects = subjects.filter((subject) =>
    papers.some((paper) => paper.id === subject.paperId),
  );
  const directPapers = papers.filter((paper) => !paper.specializationId);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white open:border-teal-200 open:shadow-md"
    >
      <summary className="cursor-pointer list-none bg-gradient-to-r from-white to-slate-50 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Status active={exam.isActive} />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Order {exam.displayOrder}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-black text-slate-950">{exam.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{exam.slug}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <StructureCount value={specializations.length} label="Specialisations" />
            <StructureCount value={papers.length} label="Papers" />
            <StructureCount value={examSubjects.length} label="Subjects" />
            <span className="ml-1 grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-lg text-teal-800 group-open:rotate-180">
             ⌄
            </span>
          </div>
        </div>
      </summary>

      <div className="border-t border-teal-100 bg-[#f8fbfb] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">
            Manage this Exam’s details, branches, Papers, and Subjects.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/admin/groups/${exam.id}/edit`}
              className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800"
            >
              Open Exam workspace
            </Link>
            <DeleteGroupButton groupId={exam.id} groupName={exam.name} />
          </div>
        </div>

        {directPapers.length > 0 && (
          <StructureSection title="Direct / common Papers" detail="Papers that belong to the whole Exam.">
            {directPapers.map((paper) => (
              <PaperBranch
                key={paper.id}
                paper={paper}
                categoryId={categoryId}
                examId={exam.id}
                specializationId={null}
                subjects={subjects.filter((subject) => subject.paperId === paper.id)}
              />
            ))}
          </StructureSection>
        )}

        {specializations.map((specialization) => {
          const specializationPapers = papers.filter(
            (paper) => paper.specializationId === specialization.id,
          );
          return (
            <StructureSection
              key={specialization.id}
              title={specialization.name}
              detail="Specialisation"
              action={
                <DeleteSpecializationButton
                  specializationId={specialization.id}
                  name={specialization.name}
                />
              }
            >
              {specializationPapers.length === 0 ? (
                <p className="rounded-xl border border-dashed bg-white p-4 text-sm text-slate-500">
                  No Papers in this Specialisation yet. Open the Exam workspace to add one.
                </p>
              ) : (
                specializationPapers.map((paper) => (
                  <PaperBranch
                    key={paper.id}
                    paper={paper}
                    categoryId={categoryId}
                    examId={exam.id}
                    specializationId={specialization.id}
                    subjects={subjects.filter(
                      (subject) => subject.paperId === paper.id,
                    )}
                  />
                ))
              )}
            </StructureSection>
          );
        })}

        {papers.length === 0 && specializations.length === 0 && (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            This Exam has no Papers yet. Open its workspace and add the first Paper.
          </div>
        )}
      </div>
    </details>
  );
}

function PaperBranch({
  paper,
  categoryId,
  examId,
  specializationId,
  subjects,
}: {
  paper: Paper;
  categoryId: string;
  examId: string;
  specializationId: string | null;
  subjects: Subject[];
}) {
  const subjectsHref = `/admin/subjects?category=${categoryId}&exam=${examId}&specialization=${specializationId ?? ""}&paper=${paper.id}`;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-black text-slate-950">{paper.name}</h5>
            <Status active={paper.isActive} compact />
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {subjects.length} {subjects.length === 1 ? "Subject" : "Subjects"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/papers/${paper.id}/edit?fromExam=${examId}`}
            className="text-sm font-bold text-teal-700 hover:underline"
          >
            Edit Paper
          </Link>
          <DeletePaperButton paperId={paper.id} paperName={paper.name} />
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Subjects
          </p>
          <Link
            href={subjectsHref}
            className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            + Add or manage Subjects
          </Link>
        </div>
        {subjects.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No Subjects added yet.</p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                  {subject.name}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/subjects/${subject.id}/edit?category=${categoryId}&exam=${examId}&specialization=${specializationId ?? ""}&paper=${paper.id}`}
                    className="text-xs font-bold text-teal-700"
                  >
                    Edit
                  </Link>
                  <DeleteSubjectButton
                    subjectId={subject.id}
                    subjectName={subject.name}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function StructureSection({
  title,
  detail,
  action,
  children,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-2xl border border-teal-100 bg-teal-50/40 p-4 last:mb-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-black text-teal-950">{title}</h4>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-teal-700">
            {detail}
          </p>
        </div>
        {action}
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function StructureCount({ value, label }: { value: number; label: string }) {
  return (
    <span className="rounded-lg bg-slate-100 px-2.5 py-2 text-slate-600">
      <strong className="text-slate-950">{value}</strong> {label}
    </span>
  );
}

function Status({ active, compact = false }: { active: boolean; compact?: boolean }) {
  return (
    <span
      className={`rounded-full font-bold ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
