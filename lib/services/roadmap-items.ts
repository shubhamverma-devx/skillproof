import { getStore } from '@/lib/db';
import type { RoadmapItem } from '@/types/domain';

/**
 * Finds the live row for an item id.
 *
 * Every replan writes a new roadmap version with new item ids, so a page that
 * has not refreshed can send the id of an item from an older version. Updating
 * that row would silently do nothing visible, so the id is resolved to the item
 * for the same skill on the latest version.
 */
export async function resolveCurrentItem(
  itemId: string,
): Promise<{ item: RoadmapItem; profileId: string }> {
  const store = getStore();

  const item = await store.getRoadmapItem(itemId);
  if (!item) throw new Error('Roadmap item not found');

  const roadmap = await store.getRoadmap(item.roadmap_id);
  if (!roadmap) throw new Error('Roadmap not found');

  const latest = await store.getLatestRoadmap(roadmap.profile_id);
  if (!latest || latest.id === roadmap.id) return { item, profileId: roadmap.profile_id };

  const current = (await store.listRoadmapItems(latest.id)).find(
    (candidate) => candidate.skill === item.skill,
  );
  return { item: current ?? item, profileId: roadmap.profile_id };
}
