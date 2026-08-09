export type SubjectContentLanguageMode = "bilingual" | "english" | "telugu";

export interface Subject {
  id: string;
  paper_id: string;
  name: string;
  slug: string;
  description: string | null;
  content_language_mode: SubjectContentLanguageMode;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectInput {
  paper_id: string;
  name: string;
  slug: string;
  description?: string;
  content_language_mode?: SubjectContentLanguageMode;
  is_active?: boolean;
  display_order?: number;
}
