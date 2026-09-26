import type {
  AgentLog,
  AgentLogLevel,
  Profile,
  QuizAttempt,
  Roadmap,
  RoadmapItem,
  ScoreHistoryEntry,
  SkillEvidence,
} from '@/types/domain';
import { JsonFile, nowIso, type Tables } from './json-file';
import type {
  EvidenceUpsert,
  NewProfile,
  NewQuizAttempt,
  NewRoadmapItem,
  ProfilePatch,
  QuizAttemptPatch,
  RoadmapItemPatch,
  SkillProofStore,
} from './types';

/**
 * Store used when Supabase credentials are absent, so the app still runs from a
 * fresh clone with no cloud setup.
 */
export class JsonStore implements SkillProofStore {
  readonly kind = 'json' as const;
  private readonly db: JsonFile;
  private readonly counters = new Map<string, { hits: number; expiresAt: number }>();

  constructor(directory?: string) {
    this.db = new JsonFile(directory);
  }

  private transaction<T>(mutate: (tables: Tables) => T): Promise<T> {
    return this.db.transaction(mutate);
  }

  private select<T>(pick: (tables: Tables) => T): Promise<T> {
    return this.db.select(pick);
  }

  async createProfile(input: NewProfile): Promise<Profile> {
    const profile: Profile = { ...input, id: crypto.randomUUID(), created_at: nowIso() };
    return this.transaction((tables) => {
      tables.profiles.push(profile);
      return profile;
    });
  }

  getProfile(id: string): Promise<Profile | null> {
    return this.select((t) => t.profiles.find((p) => p.id === id) ?? null);
  }

  updateProfile(id: string, patch: ProfilePatch): Promise<Profile> {
    return this.transaction((tables) => {
      const profile = tables.profiles.find((p) => p.id === id);
      if (!profile) throw new Error('Profile not found');
      Object.assign(profile, patch);
      return profile;
    });
  }

  replaceSkillEvidence(profileId: string, rows: EvidenceUpsert[]): Promise<SkillEvidence[]> {
    return this.transaction((tables) => {
      tables.skill_evidence = tables.skill_evidence.filter((r) => r.profile_id !== profileId);
      const created = rows.map<SkillEvidence>((row) => ({
        ...row,
        id: crypto.randomUUID(),
        profile_id: profileId,
        updated_at: nowIso(),
      }));
      tables.skill_evidence.push(...created);
      return created;
    });
  }

  listSkillEvidence(profileId: string): Promise<SkillEvidence[]> {
    return this.select((t) => t.skill_evidence.filter((r) => r.profile_id === profileId));
  }

  createQuizAttempt(input: NewQuizAttempt): Promise<QuizAttempt> {
    const attempt: QuizAttempt = {
      ...input,
      id: crypto.randomUUID(),
      score: null,
      created_at: nowIso(),
    };
    return this.transaction((tables) => {
      tables.quiz_attempts.push(attempt);
      return attempt;
    });
  }

  getQuizAttempt(id: string): Promise<QuizAttempt | null> {
    return this.select((t) => t.quiz_attempts.find((a) => a.id === id) ?? null);
  }

  updateQuizAttempt(id: string, patch: QuizAttemptPatch): Promise<QuizAttempt> {
    return this.transaction((tables) => {
      const attempt = tables.quiz_attempts.find((a) => a.id === id);
      if (!attempt) throw new Error('Quiz attempt not found');
      Object.assign(attempt, patch);
      return attempt;
    });
  }

  listQuizAttempts(profileId: string): Promise<QuizAttempt[]> {
    return this.select((t) => t.quiz_attempts.filter((a) => a.profile_id === profileId));
  }

  createRoadmap(profileId: string, version: number): Promise<Roadmap> {
    const roadmap: Roadmap = {
      id: crypto.randomUUID(),
      profile_id: profileId,
      version,
      status: 'draft',
      created_at: nowIso(),
    };
    return this.transaction((tables) => {
      tables.roadmaps.push(roadmap);
      return roadmap;
    });
  }

  getRoadmap(roadmapId: string): Promise<Roadmap | null> {
    return this.select((t) => t.roadmaps.find((r) => r.id === roadmapId) ?? null);
  }

  getLatestRoadmap(profileId: string): Promise<Roadmap | null> {
    return this.select(
      (t) =>
        t.roadmaps
          .filter((r) => r.profile_id === profileId)
          .sort((a, b) => b.version - a.version)[0] ?? null,
    );
  }

  approveRoadmap(roadmapId: string): Promise<Roadmap> {
    return this.transaction((tables) => {
      const roadmap = tables.roadmaps.find((r) => r.id === roadmapId);
      if (!roadmap) throw new Error('Roadmap not found');
      roadmap.status = 'approved';
      return roadmap;
    });
  }

  insertRoadmapItems(items: NewRoadmapItem[]): Promise<RoadmapItem[]> {
    return this.transaction((tables) => {
      const created = items.map<RoadmapItem>((item) => ({ ...item, id: crypto.randomUUID() }));
      tables.roadmap_items.push(...created);
      return created;
    });
  }

  listRoadmapItems(roadmapId: string): Promise<RoadmapItem[]> {
    return this.select((t) =>
      t.roadmap_items
        .filter((i) => i.roadmap_id === roadmapId)
        .sort((a, b) => a.week - b.week || a.order_index - b.order_index),
    );
  }

  getRoadmapItem(itemId: string): Promise<RoadmapItem | null> {
    return this.select((t) => t.roadmap_items.find((i) => i.id === itemId) ?? null);
  }

  updateRoadmapItem(itemId: string, patch: RoadmapItemPatch): Promise<RoadmapItem> {
    return this.transaction((tables) => {
      const item = tables.roadmap_items.find((i) => i.id === itemId);
      if (!item) throw new Error('Roadmap item not found');
      Object.assign(item, patch);
      return item;
    });
  }

  addScore(profileId: string, score: number, reason: string): Promise<ScoreHistoryEntry> {
    const entry: ScoreHistoryEntry = {
      id: crypto.randomUUID(),
      profile_id: profileId,
      score,
      reason,
      created_at: nowIso(),
    };
    return this.transaction((tables) => {
      tables.score_history.push(entry);
      return entry;
    });
  }

  listScores(profileId: string): Promise<ScoreHistoryEntry[]> {
    return this.select((t) =>
      t.score_history
        .filter((s) => s.profile_id === profileId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    );
  }

  /**
   * Counters live in process rather than in the JSON file: they change on every
   * request and are worthless after a restart anyway. This store is the local
   * and unconfigured path, where one process serves everything.
   */
  async consumeRateLimit(bucket: string, windowSeconds: number): Promise<number> {
    const now = Date.now();
    const entry = this.counters.get(bucket);

    if (!entry || entry.expiresAt < now) {
      this.counters.set(bucket, { hits: 1, expiresAt: now + windowSeconds * 1000 });
      if (this.counters.size > 5000) this.pruneCounters(now);
      return 1;
    }

    entry.hits += 1;
    return entry.hits;
  }

  private pruneCounters(now: number): void {
    for (const [key, value] of this.counters) {
      if (value.expiresAt < now) this.counters.delete(key);
    }
  }

  addLog(profileId: string, step: string, detail: string, level: AgentLogLevel): Promise<AgentLog> {
    const log: AgentLog = {
      id: crypto.randomUUID(),
      profile_id: profileId,
      step,
      detail,
      level,
      created_at: nowIso(),
    };
    return this.transaction((tables) => {
      tables.agent_logs.push(log);
      return log;
    });
  }

  listLogs(profileId: string): Promise<AgentLog[]> {
    return this.select((t) =>
      t.agent_logs
        .filter((l) => l.profile_id === profileId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    );
  }
}
