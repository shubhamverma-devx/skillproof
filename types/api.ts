import type { SkillAssessment } from '@/lib/scoring';
import type { RoleSlug } from './data';
import type {
  AgentLog,
  ClientQuizQuestion,
  Profile,
  Roadmap,
  RoadmapItem,
  RoadmapItemStatus,
  ScoreHistoryEntry,
} from './domain';

export type RoadmapView = {
  roadmap: Roadmap;
  items: RoadmapItem[];
  /** Populated after a replan so the UI can explain what moved and why. */
  changes: string[];
};

/** Everything a dashboard, roadmap or progress page needs in one response. */
export type ProfileState = {
  profile: Profile;
  role: { slug: RoleSlug; name: string; jd_count: number; source_note: string };
  score: number;
  /** What this profile could reach by proving what it already shows. */
  ceiling: number;
  /** How many role skills carry each kind of evidence, for the score caveats. */
  evidence_mix: { claimed: number; observed: number; tested: number };
  assessments: SkillAssessment[];
  gaps: SkillAssessment[];
  quiz_candidates: string[];
  roadmap: RoadmapView | null;
  history: ScoreHistoryEntry[];
  logs: AgentLog[];
  github: { username: string | null; scanned_repos: number; available: boolean };
  demo: boolean;
};

export type AnalyzeStreamEvent =
  | { type: 'step'; step: string; detail: string; level: AgentLog['level'] }
  | { type: 'done'; score: number }
  | { type: 'error'; message: string };

export type QuizStartResponse = {
  attempt_id: string;
  skill: string;
  question: ClientQuizQuestion;
  previous_score: number | null;
};

export type QuizAnswerResponse = {
  correct: boolean;
  correct_index: number;
  explanation: string;
  next: ClientQuizQuestion | null;
  result: {
    score: number;
    readiness: number;
    readiness_delta: number | null;
    verified: boolean;
  } | null;
};

export type ProgressEvent =
  | { type: 'item_status'; item_id: string; status: RoadmapItemStatus }
  | { type: 'repo'; repo: string }
  | { type: 'weekly_hours'; weekly_hours: number };

export type ProgressResult = {
  score: number;
  delta: number | null;
  summary: string;
  changes: string[];
  roadmap_version: number | null;
  reason: string;
};
