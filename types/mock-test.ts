export type MockTestDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "mixed";

export type MockTestStatus =
  | "draft"
  | "published"
  | "archived";

export type MockTestAccessType = "free" | "paid";
export type MockTestScope = "paper" | "subject";

export interface MockTest {
  id: string;
  paper_id: string;
  subject_id: string | null;
  test_scope: MockTestScope;
  series_number: number;
  title: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  duration_minutes: number;
  difficulty: MockTestDifficulty;
  status: MockTestStatus;
  version: number;
  display_order: number;
  published_at: string | null;
  access_type: MockTestAccessType;
  price_inr: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMockTestInput {
  paper_id: string;
  subject_id?: string | null;
  test_scope: MockTestScope;
  series_number?: number;
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  duration_minutes?: number;
  difficulty?: MockTestDifficulty;
  status?: MockTestStatus;
  version?: number;
  display_order?: number;
  access_type?: MockTestAccessType;
  price_inr?: number | null;
}
