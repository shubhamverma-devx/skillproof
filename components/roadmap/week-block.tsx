'use client';

import { Check, ChevronRight, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadmapItem } from '@/types/domain';

const STATUS_NOTE: Record<string, string> = {
  todo: 'Not started',
  doing: 'Working on it',
  done: 'Finished',
  skipped: 'Skipped',
};

export function ItemLine({
  item,
  onOpen,
}: {
  item: RoadmapItem;
  onOpen: (item: RoadmapItem) => void;
}) {
  const settled = item.status === 'done' || item.status === 'skipped';

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink/[0.02] sm:px-5"
    >
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          item.status === 'done' && 'border-verified bg-verified text-surface',
          item.status === 'skipped' && 'border-ink/20 text-ink-faint',
        )}
        aria-hidden="true"
      >
        {item.status === 'done' ? <Check size={12} strokeWidth={3} /> : null}
        {item.status === 'skipped' ? <SkipForward size={11} /> : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn('block truncate font-medium', settled && 'text-ink-muted')}>
          {item.title}
        </span>
        <span className="tabular block truncate text-sm text-ink-faint">
          {item.skill} · about {item.est_hours} hours · {STATUS_NOTE[item.status]}
        </span>
      </span>

      <ChevronRight size={15} className="shrink-0 text-ink-faint" aria-hidden="true" />
    </button>
  );
}
