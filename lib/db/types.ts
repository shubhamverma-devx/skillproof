import type {
  AgentLog,
  AgentLogLevel,
  Difficulty,
  Profile,
  QuizAttempt,
  QuizQuestion,
  Roadmap,
  RoadmapItem,
  ScoreHistoryEntry,
  SkillEvidence,
} from '@/types/domain';

export type NewProfile = Omit<Profile, 'id' | 'created_at'>;
export type ProfilePatch = Partial<Pick<Profile, 'weekly_hours' | 'github_username' | 'resume_text'>>;

export type EvidenceUpsert = Omit<SkillEvidence, 'id' | 'profile_id' | 'updated_at'>;

export type NewQuizAttempt = {
  profile_id: string;
  skill: string;
  questions: QuizQuestion[];
  answers: number[];
  difficulty_path: Difficulty[];
};

export type QuizAttemptPatch = Partial<
  Pick<QuizAttempt, 'questions' | 'answers' | 'score' | 'difficulty_path'>
>;

export type NewRoadmapItem = Omit<RoadmapItem, 'id'>;

export type RoadmapItemPatch = Partial<
  Pick<
    RoadmapItem,
    'title' | 'why' | 'est_hours' | 'status' | 'user_edited' | 'week' | 'order_index'
  >
>;

/**
 * The only database contract the rest of the app knows about. Both the Supabase
 * and the local JSON implementation satisfy it, so the app runs with or without
 * cloud credentials.
 */
export interface SkillProofStore {
  readonly kind: 'supabase' | 'json';

  createProfile(input: NewProfile): Promise<Profile>;
  getProfile(id: string): Promise<Profile | null>;
  updateProfile(id: string, patch: ProfilePatch): Promise<Profile>;

  replaceSkillEvidence(profileId: string, rows: EvidenceUpsert[]): Promise<SkillEvidence[]>;
  listSkillEvidence(profileId: string): Promise<SkillEvidence[]>;

  createQuizAttempt(input: NewQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: string): Promise<QuizAttempt | null>;
  updateQuizAttempt(id: string, patch: QuizAttemptPatch): Promise<QuizAttempt>;
  listQuizAttempts(profileId: string): Promise<QuizAttempt[]>;

  createRoadmap(profileId: string, version: number): Promise<Roadmap>;
  getLatestRoadmap(profileId: string): Promise<Roadmap | null>;
  approveRoadmap(roadmapId: string): Promise<Roadmap>;

  insertRoadmapItems(items: NewRoadmapItem[]): Promise<RoadmapItem[]>;
  listRoadmapItems(roadmapId: string): Promise<RoadmapItem[]>;
  getRoadmapItem(itemId: string): Promise<RoadmapItem | null>;
  updateRoadmapItem(itemId: string, patch: RoadmapItemPatch): Promise<RoadmapItem>;

  addScore(profileId: string, score: number, reason: string): Promise<ScoreHistoryEntry>;
  listScores(profileId: string): Promise<ScoreHistoryEntry[]>;

  addLog(
    profileId: string,
    step: string,
    detail: string,
    level: AgentLogLevel,
  ): Promise<AgentLog>;
  listLogs(profileId: string): Promise<AgentLog[]>;
}
