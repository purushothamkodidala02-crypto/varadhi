export interface Paper {
  id: string;
  exam_group_id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number | null;
  question_count: number | null;
  default_negative_marks: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePaperInput {
  exam_group_id: string;
  name: string;
  slug: string;
  description?: string;
  duration_minutes?: number | null;
  question_count?: number | null;
  default_negative_marks?: number;
  is_active?: boolean;
  display_order?: number;
}
