import type { SkillAssessment } from '@/lib/scoring';
import type { RoleSlug } from './data';
import type {
  AgentLog,
  Profile,
  Roadmap,
  RoadmapItem,
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
