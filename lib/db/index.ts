import { JsonStore } from './json-store';
import { SupabaseStore } from './supabase-store';
import type { SkillProofStore } from './types';

let store: SkillProofStore | null = null;

/**
 * Returns the single store instance for this server process: Supabase when both
 * credentials are set, otherwise the local JSON file store.
 */
export function getStore(): SkillProofStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  store = url && key ? new SupabaseStore(url, key) : new JsonStore();
  return store;
}

export type { SkillProofStore } from './types';
