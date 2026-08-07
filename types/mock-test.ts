export type MockTestDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "mixed";

export type MockTestStatus =
  | "draft"
  | "published"
  | "archived";

export interface MockTest {
  id: string;
  exam_group_id: string;
  subject_id: string | null;
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
  created_at: string;
  updated_at: string;
}

export interface CreateMockTestInput {
  exam_group_id: string;
  subject_id?: string | null;
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  duration_minutes?: number;
  difficulty?: MockTestDifficulty;
  status?: MockTestStatus;
  version?: number;
  display_order?: number;
}