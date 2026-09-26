'use client';

import { Button } from '@/components/ui/button';
import type { RoadmapItemStatus } from '@/types/domain';

const OPTIONS: Array<{ value: RoadmapItemStatus; label: string }> = [
  { value: 'todo', label: 'To do' },
  { value: 'doing', label: 'Doing' },
  { value: 'done', label: 'Done' },
  { value: 'skipped', label: 'Skip' },
];

export function ItemStatusControl({
  status,
  disabled,
  onChange,
}: {
  status: RoadmapItemStatus;
  disabled: boolean;
  onChange: (next: RoadmapItemStatus) => void;
}) {
  return (
    <div className="flex gap-1 rounded-inner bg-bg p-1" role="group" aria-label="Item status">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={status === option.value ? 'primary' : 'ghost'}
          aria-pressed={status === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export const STATUS_LABEL: Record<RoadmapItemStatus, string> = {
  todo: 'To do',
  doing: 'In progress',
  done: 'Done',
  skipped: 'Skipped',
};
