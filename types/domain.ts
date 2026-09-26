import { z } from 'zod';

export const skillCategorySchema = z.enum([
  'language',
  'framework',
  'library',
  'tool',
  'platform',
  'database',
  'concept',
]);

export const evidenceLevelSchema = z.enum(['verified', 'observed', 'claimed', 'missing']);

export const observedSourceSchema = z.object({
  repo: z.string(),
  file: z.string(),
  /** Why this file counts as proof, e.g. "package.json dependency react". */
  hint: z.string(),
});

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  target_role: z.string(),
  weekly_hours: z.number().int(),
  resume_text: z.string(),
  github_username: z.string().nullable(),
  is_demo: z.boolean(),
  created_at: z.string(),
});

export const skillEvidenceSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  skill: z.string(),
  claimed: z.boolean(),
  observed: z.boolean(),
  observed_sources: z.array(observedSourceSchema),
  verified_score: z.number().min(0).max(1).nullable(),
  proficiency: z.number().min(0).max(1),
  updated_at: z.string(),
});

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

export const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct_index: z.number().int().min(0).max(3),
  explanation: z.string(),
  difficulty: difficultySchema,
});

export const quizAttemptSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  skill: z.string(),
  questions: z.array(quizQuestionSchema),
  answers: z.array(z.number().int()),
  score: z.number().min(0).max(1).nullable(),
  difficulty_path: z.array(difficultySchema),
  created_at: z.string(),
});

export const proofProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  skills_covered: z.array(z.string()).min(1),
  acceptance_criteria: z.array(z.string()).min(3).max(5),
});

export const learningResourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(['docs', 'course', 'tutorial', 'practice', 'roadmap']),
});

export const roadmapItemStatusSchema = z.enum(['todo', 'doing', 'done', 'skipped']);

export const roadmapItemSchema = z.object({
  id: z.string(),
  roadmap_id: z.string(),
  week: z.number().int().min(1),
  skill: z.string(),
  title: z.string(),
  why: z.string(),
  evidence_summary: z.string(),
  jd_frequency: z.number().min(0).max(1),
  est_hours: z.number().int().min(1),
  resources: z.array(learningResourceSchema),
  proof_project: proofProjectSchema.nullable(),
  status: roadmapItemStatusSchema,
  user_edited: z.boolean(),
  order_index: z.number().int(),
});

export const roadmapSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  version: z.number().int().min(1),
  status: z.enum(['draft', 'approved']),
  created_at: z.string(),
});

export const scoreHistoryEntrySchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  score: z.number(),
  reason: z.string(),
  created_at: z.string(),
});

export const agentLogSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  step: z.string(),
  detail: z.string(),
  level: z.enum(['info', 'warn', 'error']),
  created_at: z.string(),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type EvidenceLevel = z.infer<typeof evidenceLevelSchema>;
export type ObservedSource = z.infer<typeof observedSourceSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type SkillEvidence = z.infer<typeof skillEvidenceSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizAttempt = z.infer<typeof quizAttemptSchema>;
export type ProofProject = z.infer<typeof proofProjectSchema>;
export type LearningResource = z.infer<typeof learningResourceSchema>;
export type RoadmapItemStatus = z.infer<typeof roadmapItemStatusSchema>;
export type RoadmapItem = z.infer<typeof roadmapItemSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
export type ScoreHistoryEntry = z.infer<typeof scoreHistoryEntrySchema>;
export type AgentLog = z.infer<typeof agentLogSchema>;
export type AgentLogLevel = AgentLog['level'];

/** A question as sent to the browser: the correct answer stays on the server. */
export type ClientQuizQuestion = Omit<QuizQuestion, 'correct_index' | 'explanation'> & {
  index: number;
  total: number;
};
