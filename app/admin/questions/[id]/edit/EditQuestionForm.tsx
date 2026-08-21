"use client";

import { useActionState, useMemo, useState } from "react";
import { PendingButtonContent } from "@/components/feedback/LoadingSpinner";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { QuestionImageField } from "@/components/admin/QuestionImageField";
import type { Question, QuestionLifecycle } from "@/types/question";
import type { SubjectContentLanguageMode } from "@/types/subject";
import { updateQuestion, type UpdateQuestionState } from "./actions";

type SubjectOption = {
  id: string;
  label: string;
  contentLanguageMode: SubjectContentLanguageMode;
};

const initialState: UpdateQuestionState = { success: false, message: "" };

export function EditQuestionForm({
  question,
  subjects,
}: {
  question: Question;
  subjects: SubjectOption[];
}) {
  const [state, action, pending] = useActionState(
    updateQuestion.bind(null, question.id),
    initialState,
  );
  const [subjectId, setSubjectId] = useState(question.subject_id);
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer);
  const [lifecycle, setLifecycle] = useState<QuestionLifecycle>(
    question.content_lifecycle,
  );
  const languageMode = useMemo(
    () =>
      subjects.find((subject) => subject.id === subjectId)?.contentLanguageMode ??
      "bilingual",
    [subjectId, subjects],
  );

  const showEnglish = languageMode !== "telugu";
  const showTelugu = languageMode !== "english";

  return (
    <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm sm:p-7">
      <form action={action} className="space-y-6">
        <label className="block text-sm font-bold">
          Question classification
          <SearchableSelect
            name="subject_id"
            value={subjectId}
            onChange={setSubjectId}
            options={subjects.map((subject) => ({
              value: subject.id,
              label: subject.label,
            }))}
            placeholder="Search for a subject"
          />
        </label>

        <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          <span className="font-black">Question language: </span>
          {languageMode === "bilingual"
            ? "English + Telugu"
            : languageMode === "telugu"
              ? "Telugu only"
              : "English only"}
        </div>

        <div className={`grid gap-5 ${showEnglish && showTelugu ? "xl:grid-cols-2" : ""}`}>
          {showEnglish && (
            <LanguageFields
              language="English"
              suffix=""
              question={question.question_text}
              options={[question.option_a, question.option_b, question.option_c, question.option_d]}
              explanation={question.explanation ?? ""}
              required
            />
          )}
          {showTelugu && (
            <LanguageFields
              language="తెలుగు"
              suffix="_te"
              question={question.question_text_te ?? (languageMode === "telugu" ? question.question_text : "")}
              options={[
                question.option_a_te ?? (languageMode === "telugu" ? question.option_a : ""),
                question.option_b_te ?? (languageMode === "telugu" ? question.option_b : ""),
                question.option_c_te ?? (languageMode === "telugu" ? question.option_c : ""),
                question.option_d_te ?? (languageMode === "telugu" ? question.option_d : ""),
              ]}
              explanation={question.explanation_te ?? (languageMode === "telugu" ? question.explanation ?? "" : "")}
              required
              lang="te"
            />
          )}
        </div>

        <QuestionImageField currentUrl={question.image_url} />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-bold">
            Correct answer
            <SearchableSelect
              name="correct_answer"
              value={correctAnswer}
              onChange={(value) =>
                setCorrectAnswer(value as Question["correct_answer"])
              }
              options={["A", "B", "C", "D"].map((answer) => ({
                value: answer,
                label: `Option ${answer}`,
              }))}
              placeholder="Choose the correct option"
            />
          </label>
          <label className="block text-sm font-bold">
            Question lifetime
            <SearchableSelect
              name="content_lifecycle"
              value={lifecycle}
              onChange={(value) => setLifecycle(value as QuestionLifecycle)}
              options={[
                { value: "permanent", label: "Permanent" },
                { value: "review", label: "Review later" },
                { value: "expires", label: "Expire after a date" },
              ]}
              placeholder="Choose a lifetime setting"
            />
          </label>
        </div>

        {lifecycle === "review" && (
          <label className="block text-sm font-bold">
            Review on
            <input name="review_on" required type="date" defaultValue={question.review_on ?? ""} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
          </label>
        )}
        {lifecycle === "expires" && (
          <label className="block text-sm font-bold">
            Stop using after
            <input name="expires_on" required type="date" defaultValue={question.expires_on ?? ""} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
          </label>
        )}

        <label className="block text-sm font-bold">
          Source reference
          <input name="source_reference" defaultValue={question.source_reference ?? ""} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" />
        </label>
        <label className="flex items-center gap-3 text-sm font-bold">
          <input name="is_active" type="checkbox" defaultChecked={question.is_active} className="h-4 w-4" />
          Ready to use in mock tests
        </label>
        <button disabled={pending} aria-busy={pending} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
          <PendingButtonContent pending={pending} pendingLabel="Saving question…">Save Question</PendingButtonContent>
        </button>
        {state.message && (
          <p className={`text-sm font-semibold ${state.success ? "text-emerald-700" : "text-red-700"}`}>
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}

function LanguageFields({
  language,
  suffix,
  question,
  options,
  explanation,
  required,
  lang,
}: {
  language: string;
  suffix: "" | "_te";
  question: string;
  options: string[];
  explanation: string;
  required: boolean;
  lang?: string;
}) {
  return (
    <fieldset lang={lang} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <legend className="px-2 text-sm font-black text-slate-950">{language}</legend>
      <label className="block text-sm font-bold">
        Question
        <textarea name={`question_text${suffix}`} required={required} rows={5} defaultValue={question} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal leading-7" />
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {options.map((value, index) => {
          const letter = String.fromCharCode(65 + index);
          return (
            <label key={letter} className="block text-sm font-bold">
              Option {letter}
              <textarea name={`option_${letter.toLowerCase()}${suffix}`} required={required} rows={2} defaultValue={value} className="mt-2 w-full resize-y rounded-xl border bg-white px-4 py-3 font-normal leading-6" />
            </label>
          );
        })}
      </div>
      <label className="mt-4 block text-sm font-bold">
        Explanation <span className="font-normal text-slate-500">(optional)</span>
        <textarea name={`explanation${suffix}`} rows={3} defaultValue={explanation} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal leading-6" />
      </label>
    </fieldset>
  );
}
