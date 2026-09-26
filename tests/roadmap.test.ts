import { describe, expect, it } from 'vitest';
import { hoursByWeek, packIntoWeeks } from '@/lib/roadmap/hours';
import { diffRoadmaps } from '@/lib/roadmap/diff';
import { whitelistResources } from '@/lib/roadmap/validate';
import { prerequisiteDepth } from '@/lib/roadmap/prerequisites';

describe('packIntoWeeks', () => {
  it('never lets a week exceed the hour budget', () => {
    const packed = packIntoWeeks(
      [{ est_hours: 5 }, { est_hours: 5 }, { est_hours: 4 }, { est_hours: 8 }],
      8,
    );
    for (const [, hours] of hoursByWeek(packed)) {
      expect(hours).toBeLessThanOrEqual(8);
    }
    // Leftover hours are not backfilled from later items: that would move a
    // skill ahead of its prerequisite to save three hours.
    expect(packed.map((item) => item.week)).toEqual([1, 2, 3, 4]);
  });

  it('keeps the given order, so prerequisites stay ahead', () => {
    const packed = packIntoWeeks([{ id: 'a', est_hours: 6 }, { id: 'b', est_hours: 6 }], 8);
    expect(packed.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('trims an item larger than a whole week rather than dropping it', () => {
    const packed = packIntoWeeks([{ est_hours: 20 }], 6);
    expect(packed).toHaveLength(1);
    expect(packed[0]?.est_hours).toBe(6);
    expect(packed[0]?.week).toBe(1);
  });

  it('starts after hours already committed by finished items', () => {
    const packed = packIntoWeeks([{ est_hours: 5 }], 8, new Map([[1, 6]]));
    expect(packed[0]?.week).toBe(2);
  });

  it('numbers items within their own week', () => {
    const packed = packIntoWeeks([{ est_hours: 3 }, { est_hours: 3 }, { est_hours: 3 }], 6);
    expect(packed.map((item) => [item.week, item.order_index])).toEqual([
      [1, 0],
      [1, 1],
      [2, 0],
    ]);
  });
});

describe('whitelistResources', () => {
  it('keeps approved links and counts the invented ones', () => {
    const { resources, dropped } = whitelistResources('Docker', [
      'https://docs.docker.com/get-started/',
      'https://example.com/docker-course-that-does-not-exist',
    ]);
    expect(resources.map((resource) => resource.url)).toEqual([
      'https://docs.docker.com/get-started/',
    ]);
    expect(dropped).toBe(1);
  });

  it('falls back to the curated list when every link was invented', () => {
    const { resources, dropped } = whitelistResources('Docker', ['https://not-real.example']);
    expect(dropped).toBe(1);
    expect(resources.length).toBeGreaterThan(0);
    expect(resources.every((resource) => resource.url.startsWith('https://'))).toBe(true);
  });
});

describe('prerequisiteDepth', () => {
  it('places a skill after the prerequisites that are also being planned', () => {
    const planned = new Set(['Python', 'Deep learning', 'PyTorch', 'Machine learning']);
    expect(prerequisiteDepth('Python', planned)).toBe(0);
    expect(prerequisiteDepth('Machine learning', planned)).toBe(1);
    expect(prerequisiteDepth('PyTorch', planned)).toBeGreaterThan(
      prerequisiteDepth('Deep learning', planned),
    );
  });

  it('ignores prerequisites the student already proves', () => {
    expect(prerequisiteDepth('PyTorch', new Set(['PyTorch']))).toBe(0);
  });
});

describe('diffRoadmaps', () => {
  const item = (skill: string, week: number, status: 'todo' | 'done' = 'todo') => ({
    skill,
    week,
    status,
  });

  it('reports moves, additions and removals in plain sentences', () => {
    const changes = diffRoadmaps(
      [item('Docker', 3), item('SQL', 1, 'done')],
      [item('Docker', 1), item('PyTorch', 2)],
    );
    expect(changes[0]).toBe('Docker moved from week 3 to week 1.');
    expect(changes).toContain('PyTorch was added to the plan.');
    expect(changes).toContain('SQL left the plan because you finished it.');
  });

  it('says nothing when the plan did not move', () => {
    expect(diffRoadmaps([item('Docker', 1)], [item('Docker', 1)])).toEqual([]);
  });
});
