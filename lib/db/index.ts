import { JsonStore } from './json-store';
import { SupabaseStore } from './supabase-store';
import type { SkillProofStore } from './types';

export type StorageStatus = 'supabase' | 'local' | 'unconfigured';

let store: SkillProofStore | null = null;
let warned = false;

function credentials(): { url?: string; key?: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Which store is in use. On Vercel the filesystem is not durable between
 * invocations, so a missing Supabase configuration is a real problem there and
 * is reported rather than quietly degraded.
 */
export function getStorageStatus(): StorageStatus {
  const { url, key } = credentials();
  if (url && key) return 'supabase';
  return process.env.VERCEL ? 'unconfigured' : 'local';
}

/**
 * Returns the single store instance for this server process: Supabase when both
 * credentials are set, otherwise the local JSON file store.
 */
export function getStore(): SkillProofStore {
  if (store) return store;

  if (getStorageStatus() === 'unconfigured' && !warned) {
    warned = true;
    console.error(
      'Storage is not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing in a serverless deployment, so profiles will not survive between requests.',
    );
  }

  const { url, key } = credentials();
  store = url && key ? new SupabaseStore(url, key) : new JsonStore();
  return store;
}

export type { SkillProofStore } from './types';
