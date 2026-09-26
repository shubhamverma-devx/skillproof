import { z } from 'zod';
import { buildRoadmap } from '@/lib/agent/buildRoadmap';
import { Tracer } from '@/lib/agent/trace';
import { ROADMAP } from '@/lib/config';
import { getStore } from '@/lib/db';
import { recordProgress } from './progress-service';
import { resolveCurrentItem } from './roadmap-items';
import type { ProgressResult } from '@/types/api';
import type { Roadmap, RoadmapItem } from '@/types/domain';

export const itemPatchSchema = z
  .object({
    title: z.string().trim().min(4).max(120).optional(),
    why: z.string().trim().min(10).max(600).optional(),
    est_hours: z.number().int().min(ROADMAP.minItemHours).max(ROADMAP.maxItemHours).optional(),
    week: z.number().int().min(1).max(16).optional(),
    order_index: z.number().int().min(0).max(20).optional(),
    status: z.enum(['todo', 'doing', 'done', 'skipped']).optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, 'Send at least one field to change');

export type ItemPatch = z.infer<typeof itemPatchSchema>;

export async function generateRoadmap(profileId: string): Promise<{
  roadmap: Roadmap;
  items: RoadmapItem[];
  changes: string[];
}> {
  const { roadmap, items, changes } = await buildRoadmap(
    profileId,
    'Generated from your current gaps',
  );
  return { roadmap, items, changes };
}

export async function approveRoadmap(profileId: string): Promise<Roadmap> {
  const store = getStore();
  const roadmap = await store.getLatestRoadmap(profileId);
  if (!roadmap) throw new Error('There is no roadmap to approve yet.');
  if (roadmap.status === 'approved') return roadmap;

  const approved = await store.approveRoadmap(roadmap.id);
  await new Tracer(profileId).info(
    'Roadmap approved',
    `Version ${roadmap.version} was approved by the student`,
  );
  return approved;
}

/**
 * Applies a student edit to one item. Any touched item is marked user edited,
 * which locks it: later replans copy it across instead of rewriting it.
 * Finishing or skipping an item also triggers a replan of everything after it.
 */
export async function updateRoadmapItem(
  itemId: string,
  patch: ItemPatch,
): Promise<{ item: RoadmapItem; progress: ProgressResult | null }> {
  const store = getStore();
  const { item, profileId } = await resolveCurrentItem(itemId);

  const { status, ...edits } = patch;
  if (Object.keys(edits).length > 0) await applyEdit(item.id, edits, profileId);

  if (status && status !== item.status) {
    const progress = await recordProgress(profileId, {
      type: 'item_status',
      item_id: item.id,
      status,
    });
    return { item: (await store.getRoadmapItem(item.id)) ?? item, progress };
  }

  return { item: (await store.getRoadmapItem(item.id)) ?? item, progress: null };
}

async function applyEdit(
  itemId: string,
  patch: Omit<ItemPatch, 'status'>,
  profileId: string,
): Promise<RoadmapItem> {
  const updated = await getStore().updateRoadmapItem(itemId, { ...patch, user_edited: true });
  await new Tracer(profileId).info(
    'Roadmap item edited',
    `"${updated.title}" was changed by the student and is now locked against replanning`,
  );
  return updated;
}
