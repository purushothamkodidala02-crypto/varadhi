export type CorrectAnswer = "A" | "B" | "C" | "D";

export interface Question {
  id: string;
  subject_id: string | null;
  question_text: string;
  question_type: "mcq";
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: CorrectAnswer;
  explanation: string | null;
  difficulty: string;
  image_url: string | null;
  source_reference: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionInput {
  subject_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: CorrectAnswer;
  explanation?: string;
  image_url?: string;
  source_reference?: string;
  is_active?: boolean;
}

export interface MockTestQuestion {
  id: string;
  mock_test_id: string;
  question_id: string;
  question_order: number;
  marks: number;
  negative_marks: number;
  created_at: string;
}