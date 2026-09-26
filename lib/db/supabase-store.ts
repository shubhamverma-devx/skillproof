import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
 * Supabase implementation. Instantiated with the service role key on the server
 * only; no Supabase client ever reaches the browser bundle.
 */
export class SupabaseStore implements SkillProofStore {
  readonly kind = 'supabase' as const;
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private table(name: string) {
    return this.client.from(name);
  }

  async createProfile(input: NewProfile): Promise<Profile> {
    return this.one<Profile>(this.table('profiles').insert(input).select().single());
  }

  async getProfile(id: string): Promise<Profile | null> {
    return this.maybe<Profile>(this.table('profiles').select('*').eq('id', id).maybeSingle());
  }

  async updateProfile(id: string, patch: ProfilePatch): Promise<Profile> {
    return this.one<Profile>(this.table('profiles').update(patch).eq('id', id).select().single());
  }

  async replaceSkillEvidence(profileId: string, rows: EvidenceUpsert[]): Promise<SkillEvidence[]> {
    const deletion = await this.table('skill_evidence').delete().eq('profile_id', profileId);
    if (deletion.error) throw new Error(deletion.error.message);
    if (rows.length === 0) return [];
    return this.many<SkillEvidence>(
      this.table('skill_evidence')
        .insert(rows.map((row) => ({ ...row, profile_id: profileId })))
        .select(),
    );
  }

  async listSkillEvidence(profileId: string): Promise<SkillEvidence[]> {
    return this.many<SkillEvidence>(
      this.table('skill_evidence').select('*').eq('profile_id', profileId),
    );
  }

  async createQuizAttempt(input: NewQuizAttempt): Promise<QuizAttempt> {
    return this.one<QuizAttempt>(this.table('quiz_attempts').insert(input).select().single());
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | null> {
    return this.maybe<QuizAttempt>(this.table('quiz_attempts').select('*').eq('id', id).maybeSingle());
  }

  async updateQuizAttempt(id: string, patch: QuizAttemptPatch): Promise<QuizAttempt> {
    return this.one<QuizAttempt>(
      this.table('quiz_attempts').update(patch).eq('id', id).select().single(),
    );
  }

  async listQuizAttempts(profileId: string): Promise<QuizAttempt[]> {
    return this.many<QuizAttempt>(
      this.table('quiz_attempts').select('*').eq('profile_id', profileId),
    );
  }

  async createRoadmap(profileId: string, version: number): Promise<Roadmap> {
    return this.one<Roadmap>(
      this.table('roadmaps')
        .insert({ profile_id: profileId, version, status: 'draft' })
        .select()
        .single(),
    );
  }

  async getLatestRoadmap(profileId: string): Promise<Roadmap | null> {
    return this.maybe<Roadmap>(
      this.table('roadmaps')
        .select('*')
        .eq('profile_id', profileId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
  }

  async approveRoadmap(roadmapId: string): Promise<Roadmap> {
    return this.one<Roadmap>(
      this.table('roadmaps').update({ status: 'approved' }).eq('id', roadmapId).select().single(),
    );
  }

  async insertRoadmapItems(items: NewRoadmapItem[]): Promise<RoadmapItem[]> {
    if (items.length === 0) return [];
    return this.many<RoadmapItem>(this.table('roadmap_items').insert(items).select());
  }

  async listRoadmapItems(roadmapId: string): Promise<RoadmapItem[]> {
    return this.many<RoadmapItem>(
      this.table('roadmap_items')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('week', { ascending: true })
        .order('order_index', { ascending: true }),
    );
  }

  async getRoadmapItem(itemId: string): Promise<RoadmapItem | null> {
    return this.maybe<RoadmapItem>(
      this.table('roadmap_items').select('*').eq('id', itemId).maybeSingle(),
    );
  }

  async updateRoadmapItem(itemId: string, patch: RoadmapItemPatch): Promise<RoadmapItem> {
    return this.one<RoadmapItem>(
      this.table('roadmap_items').update(patch).eq('id', itemId).select().single(),
    );
  }

  async addScore(profileId: string, score: number, reason: string): Promise<ScoreHistoryEntry> {
    return this.one<ScoreHistoryEntry>(
      this.table('score_history').insert({ profile_id: profileId, score, reason }).select().single(),
    );
  }

  async listScores(profileId: string): Promise<ScoreHistoryEntry[]> {
    return this.many<ScoreHistoryEntry>(
      this.table('score_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true }),
    );
  }

  async addLog(
    profileId: string,
    step: string,
    detail: string,
    level: AgentLogLevel,
  ): Promise<AgentLog> {
    return this.one<AgentLog>(
      this.table('agent_logs')
        .insert({ profile_id: profileId, step, detail, level })
        .select()
        .single(),
    );
  }

  async listLogs(profileId: string): Promise<AgentLog[]> {
    return this.many<AgentLog>(
      this.table('agent_logs')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true }),
    );
  }

  private async one<T>(query: PromiseLike<SupabaseResult>): Promise<T> {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Row not found');
    return data as T;
  }

  private async maybe<T>(query: PromiseLike<SupabaseResult>): Promise<T | null> {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as T | null) ?? null;
  }

  private async many<T>(query: PromiseLike<SupabaseResult>): Promise<T[]> {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as T[];
  }
}

type SupabaseResult = { data: unknown; error: { message: string } | null };
