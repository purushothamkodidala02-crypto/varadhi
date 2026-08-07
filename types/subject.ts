export interface Subject {
  id: string;
  exam_group_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectInput {
  exam_group_id: string;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}