'use client';

import { ChevronDown, ExternalLink, GripVertical, Lock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/field';
import { cn, formatPercent } from '@/lib/utils';
import type { RoadmapItem, RoadmapItemStatus } from '@/types/domain';
import { ItemStatusControl, STATUS_LABEL } from './item-status';

const STATUS_TONE: Record<RoadmapItemStatus, string> = {
  todo: 'text-muted',
  doing: 'text-primary',
  done: 'text-observed-ink',
  skipped: 'text-muted line-through',
};

export function RoadmapItemRow({
  item,
  busy,
  onStatusChange,
  onEdit,
  onMove,
  dragHandlers,
  canMoveUp,
  canMoveDown,
}: {
  item: RoadmapItem;
  busy: boolean;
  onStatusChange: (status: RoadmapItemStatus) => void;
  onEdit: (patch: { title?: string; est_hours?: number }) => void;
  onMove: (direction: -1 | 1) => void;
  dragHandlers: React.HTMLAttributes<HTMLDivElement>;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [hours, setHours] = useState(String(item.est_hours));
  const detailId = `item-${item.id}`;

  function save() {
    const parsed = Number(hours);
    onEdit({
      title: title.trim() === item.title ? undefined : title.trim(),
      est_hours: Number.isFinite(parsed) && parsed !== item.est_hours ? parsed : undefined,
    });
    setEditing(false);
  }

  return (
    <div className="px-4 py-3 sm:px-5" draggable {...dragHandlers}>
      <div className="flex items-start gap-3">
        <span
          className="mt-1 hidden cursor-grab text-muted sm:block"
          aria-hidden="true"
          title="Drag to reorder within the week"
        >
          <GripVertical size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn('font-medium', STATUS_TONE[item.status])}>{item.title}</span>
            {item.user_edited ? (
              <span
                className="flex items-center gap-1 text-ui-sm text-muted"
                title="You changed this item, so replanning will not rewrite it"
              >
                <Lock size={12} aria-hidden="true" />
                Yours
              </span>
            ) : null}
          </div>
          <p className="tabular mt-0.5 text-ui-sm text-muted">
            {item.skill}, {item.est_hours} hours, in {formatPercent(item.jd_frequency)} of job
            descriptions, {STATUS_LABEL[item.status]}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown
            size={16}
            className={cn('transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
          <span className="sr-only">{open ? 'Hide details' : `Details for ${item.title}`}</span>
        </Button>
      </div>

      {open ? (
        <div id={detailId} className="mt-3 space-y-4 rounded-inner bg-bg px-4 py-3">
          <div>
            <h4 className="text-ui-sm font-medium">Why this is here</h4>
            <p className="mt-1 max-w-prose text-ui-sm text-muted">{item.why}</p>
          </div>

          {item.resources.length > 0 ? (
            <div>
              <h4 className="text-ui-sm font-medium">Resources</h4>
              <ul className="mt-1 space-y-1">
                {item.resources.map((resource) => (
                  <li key={resource.url}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-ui-sm text-primary underline underline-offset-2"
                    >
                      {resource.title}
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                    <span className="ml-2 text-ui-sm text-muted">{resource.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {item.proof_project ? (
            <div>
              <h4 className="text-ui-sm font-medium">Proof project: {item.proof_project.title}</h4>
              <p className="mt-1 max-w-prose text-ui-sm text-muted">
                {item.proof_project.description}
              </p>
              <p className="mt-1 text-ui-sm text-muted">
                Covers {item.proof_project.skills_covered.join(' and ')}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ui-sm">
                {item.proof_project.acceptance_criteria.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {editing ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-48 flex-1">
                <Label htmlFor={`title-${item.id}`}>Title</Label>
                <Input
                  id={`title-${item.id}`}
                  className="mt-1"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="w-28">
                <Label htmlFor={`hours-${item.id}`}>Hours</Label>
                <Input
                  id={`hours-${item.id}`}
                  className="mt-1"
                  type="number"
                  min={2}
                  max={12}
                  value={hours}
                  onChange={(event) => setHours(event.target.value)}
                />
              </div>
              <Button onClick={save} disabled={busy}>
                Save changes
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <ItemStatusControl status={item.status} disabled={busy} onChange={onStatusChange} />
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canMoveUp || busy}
                  onClick={() => onMove(-1)}
                >
                  Move up
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canMoveDown || busy}
                  onClick={() => onMove(1)}
                >
                  Move down
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
