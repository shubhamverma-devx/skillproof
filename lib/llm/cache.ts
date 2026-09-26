import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import llmCache from '@/data/demo/llm_cache.json';

const CACHE_FILE = path.join(process.cwd(), 'data', 'demo', 'llm_cache.json');

/**
 * Responses recorded for the demo profile. Shipped as a bundled import so replay
 * works in a serverless deployment, with a copy in memory for entries recorded
 * during this process.
 */
const entries: Record<string, unknown> = { ...(llmCache as Record<string, unknown>) };

export function readCachedResponse(key: string): unknown {
  return entries[key];
}

/**
 * Recording helper used when the demo profile runs with real API keys present.
 * A failed write is not an error: the repo directory is read only on Vercel.
 */
export async function writeCachedResponse(key: string, value: unknown): Promise<void> {
  entries[key] = value;
  try {
    await writeFile(CACHE_FILE, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  } catch {
    // Recording is a development convenience, never required at request time.
  }
}

/**
 * Cache keys are readable for the demo profile so recorded responses can be
 * inspected and edited by hand; live profiles get a content hash instead.
 */
export function makeCacheKey(isDemo: boolean, parts: string[], contentHash: string): string {
  return isDemo ? ['demo', ...parts].join(':') : ['live', ...parts, contentHash].join(':');
}

export function hashText(text: string): string {
  const normalised = text.replace(/\s+/g, ' ').trim();
  let hash = 0;
  for (let index = 0; index < normalised.length; index += 1) {
    hash = (hash * 31 + normalised.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}
