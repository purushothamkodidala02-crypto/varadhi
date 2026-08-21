export interface ExamGroup {
  id: string;
  exam_id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExamGroupWithExam extends ExamGroup {
  exams: {
    name: string;
  } | null;
}

export interface CreateExamGroupInput {
  exam_id: string;
  name: string;
  slug: string;
  description?: string;
  seo_title?: string;
  seo_description?: string;
  is_active?: boolean;
  display_order?: number;
}
