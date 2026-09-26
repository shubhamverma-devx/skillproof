import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'demo', 'llm_cache.json');

type CacheShape = Record<string, unknown>;

let cache: CacheShape | null = null;

async function load(): Promise<CacheShape> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(CACHE_FILE, 'utf8')) as CacheShape;
  } catch {
    cache = {};
  }
  return cache;
}

export async function readCachedResponse(key: string): Promise<unknown | undefined> {
  const entries = await load();
  return entries[key];
}

/**
 * Only used when recording the demo profile with real keys present. Failure to
 * write is not an error: on Vercel the repo directory is read only.
 */
export async function writeCachedResponse(key: string, value: unknown): Promise<void> {
  const entries = await load();
  entries[key] = value;
  try {
    await writeFile(CACHE_FILE, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  } catch {
    // Recording is a development convenience, never required at request time.
  }
}
