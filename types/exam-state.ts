export type ExamState = {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
};
