export interface Exam {
  id: string;
  state_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateExamInput {
  state_id: string;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}
