import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {
  AgentLog,
  Profile,
  QuizAttempt,
  Roadmap,
  RoadmapItem,
  ScoreHistoryEntry,
  SkillEvidence,
} from '@/types/domain';

export type Tables = {
  profiles: Profile[];
  skill_evidence: SkillEvidence[];
  quiz_attempts: QuizAttempt[];
  roadmaps: Roadmap[];
  roadmap_items: RoadmapItem[];
  score_history: ScoreHistoryEntry[];
  agent_logs: AgentLog[];
};

const EMPTY: Tables = {
  profiles: [],
  skill_evidence: [],
  quiz_attempts: [],
  roadmaps: [],
  roadmap_items: [],
  score_history: [],
  agent_logs: [],
};

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Serialised JSON file access. Writes go through one promise chain and land via
 * temp file + rename, so a crash mid-write cannot truncate the database.
 */
export class JsonFile {
  private readonly file: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(directory?: string) {
    const dir = directory ?? (process.env.VERCEL ? path.join(os.tmpdir(), 'skillproof') : '.data');
    this.file = path.resolve(dir, 'store.json');
  }

  async read(): Promise<Tables> {
    try {
      const raw = await readFile(this.file, 'utf8');
      return { ...structuredClone(EMPTY), ...(JSON.parse(raw) as Partial<Tables>) };
    } catch {
      return structuredClone(EMPTY);
    }
  }

  /** Read-modify-write under the queue; concurrent callers cannot interleave. */
  transaction<T>(mutate: (tables: Tables) => T | Promise<T>): Promise<T> {
    const next = this.queue.then(async () => {
      const tables = await this.read();
      const result = await mutate(tables);
      await this.persist(tables);
      return result;
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  async select<T>(pick: (tables: Tables) => T): Promise<T> {
    return pick(await this.read());
  }

  private async persist(tables: Tables): Promise<void> {
    await mkdir(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(tables, null, 2), 'utf8');
    await rename(temp, this.file);
  }
}
