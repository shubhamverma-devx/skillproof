'use client';

import { ExternalLink } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { demandPhrase } from '@/lib/wording';
import type { RoadmapItem, RoadmapItemStatus } from '@/types/domain';

const STATUS_ACTION: Array<{ value: RoadmapItemStatus; label: string }> = [
  { value: 'todo', label: 'Not started' },
  { value: 'doing', label: 'Working on it' },
  { value: 'done', label: 'Finished' },
  { value: 'skipped', label: 'Skip this' },
];

/** Everything about one week's task, out of the way until it is asked for. */
export function ItemSheet({
  item,
  busy,
  onOpenChange,
  onStatus,
}: {
  item: RoadmapItem | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onStatus: (item: RoadmapItem, status: RoadmapItemStatus) => void;
}) {
  return (
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      {item ? (
        <SheetContent
          title={item.title}
          subtitle={`Week ${item.week} · ${item.skill} · about ${item.est_hours} hours`}
        >
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="text-sm font-medium">Why this is on your list</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{item.why}</p>
              <p className="mt-1.5 text-xs text-ink-faint">{demandPhrase(item.jd_frequency)}</p>
            </section>

            {item.resources.length > 0 ? (
              <section>
                <h3 className="text-sm font-medium">Where to learn it</h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {item.resources.map((resource) => (
                    <li key={resource.url}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-sm text-accent underline-offset-2 hover:underline"
                      >
                        {resource.title}
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {item.proof_project ? (
              <section>
                <h3 className="text-sm font-medium">Build this to prove it</h3>
                <p className="mt-1.5 font-medium">{item.proof_project.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{item.proof_project.description}</p>
                <p className="mt-2 text-xs text-ink-faint">
                  Covers {item.proof_project.skills_covered.join(' and ')}
                </p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {item.proof_project.acceptance_criteria.map((criterion) => (
                    <li key={criterion} className="flex gap-2 text-sm text-ink-muted">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint"
                      />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h3 className="text-sm font-medium">Where are you with this?</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {STATUS_ACTION.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={item.status === option.value ? 'primary' : 'secondary'}
                    disabled={busy}
                    onClick={() => onStatus(item, option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {item.user_edited ? (
                <p className="mt-2 text-xs text-ink-faint">
                  You changed this one, so we will not rewrite it when the plan updates.
                </p>
              ) : null}
            </section>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
