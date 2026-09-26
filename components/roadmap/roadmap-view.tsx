'use client';

import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Panel } from '@/components/ui/panel';
import { patchJson, postJson } from '@/lib/client/api';
import { cn } from '@/lib/utils';
import type { ProfileState, ProgressResult } from '@/types/api';
import type { RoadmapItem, RoadmapItemStatus } from '@/types/domain';
import { ChangesBox } from './changes-box';
import { ItemSheet } from './item-sheet';
import { ItemLine } from './week-block';

type PatchResponse = { item: RoadmapItem; progress: ProgressResult | null };

export function RoadmapView({ state }: { state: ProfileState }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<RoadmapItem | null>(null);
  const [changes, setChanges] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number[]>([]);

  const roadmap = state.roadmap;
  const items = roadmap?.items ?? [];
  const weeks = [...new Set(items.map((item) => item.week))].sort((a, b) => a - b);

  const currentWeek = weeks.find((week) =>
    items.some((item) => item.week === week && item.status !== 'done' && item.status !== 'skipped'),
  );
  const thisWeek = items.filter((item) => item.week === currentWeek);
  const doneThisWeek = thisWeek.filter((item) => item.status === 'done').length;
  const hoursLeft = thisWeek
    .filter((item) => item.status !== 'done' && item.status !== 'skipped')
    .reduce((sum, item) => sum + item.est_hours, 0);

  async function generate() {
    setBusy(true);
    const response = await postJson(`/api/roadmap/${state.profile.id}/generate`, {});
    setBusy(false);
    if ('error' in response) return toast.error(response.error);
    toast.success('Your plan is ready');
    router.refresh();
  }

  async function approve() {
    setBusy(true);
    const response = await postJson(`/api/roadmap/${state.profile.id}/approve`, {});
    setBusy(false);
    if ('error' in response) return toast.error(response.error);
    toast.success('Plan approved');
    router.refresh();
  }

  async function setStatus(item: RoadmapItem, status: RoadmapItemStatus) {
    setBusy(true);
    const response = await patchJson<PatchResponse>(`/api/roadmap/item/${item.id}`, { status });
    setBusy(false);
    if ('error' in response) return toast.error(response.error);

    setOpen(null);
    toast.success('Saved');
    if (response.data.progress) {
      setChanges(response.data.progress.changes);
      setSummary(response.data.progress.summary);
    }
    router.refresh();
  }

  if (!roadmap || items.length === 0) {
    return (
      <Panel>
        <EmptyState
          title="You do not have a plan yet"
          body={`We know which skills are missing for ${state.role.name} work. Turn that into a week by week plan that fits ${state.profile.weekly_hours} hours a week. You can change anything afterwards.`}
          action={
            <Button size="lg" onClick={generate} disabled={busy}>
              {busy ? 'Building your plan' : 'Build my plan'}
            </Button>
          }
        />
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {roadmap.roadmap.status === 'draft' ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-accent/25 bg-accent/[0.04] px-5 py-4">
          <p className="max-w-prose text-sm">
            <span className="font-medium">This is a draft.</span> Have a look, change anything that
            does not fit, then approve it.
          </p>
          <Button onClick={approve} disabled={busy}>
            Approve plan
          </Button>
        </section>
      ) : null}

      <ChangesBox changes={changes} summary={summary} />

      {currentWeek ? (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-lg">This week</h2>
              <p className="tabular mt-0.5 text-sm text-ink-muted">
                Week {currentWeek} of {weeks.length}. {doneThisWeek} of {thisWeek.length} done,{' '}
                {hoursLeft} hours left.
              </p>
            </div>
          </div>
          <div className="divide-y border-t">
            {thisWeek.map((item) => (
              <ItemLine key={item.id} item={item} onOpen={setOpen} />
            ))}
          </div>
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            title="Every week is done"
            body="You have finished or skipped everything in this plan. Rebuild it to get a fresh one from your current gaps."
            action={
              <Button variant="secondary" onClick={generate} disabled={busy}>
                Rebuild my plan
              </Button>
            }
          />
        </Panel>
      )}

      <Panel>
        <div className="px-4 py-3.5 sm:px-5">
          <h2 className="text-base font-medium">The rest of the plan</h2>
          <p className="tabular mt-0.5 text-sm text-ink-muted">
            {weeks.length} weeks in total, about{' '}
            {items.reduce((sum, item) => sum + item.est_hours, 0)} hours, never more than{' '}
            {state.profile.weekly_hours} hours in a week.
          </p>
        </div>

        <div className="border-t">
          {weeks
            .filter((week) => week !== currentWeek)
            .map((week) => {
              const weekItems = items.filter((item) => item.week === week);
              const isOpen = expanded.includes(week);
              return (
                <div key={week} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((current) =>
                        current.includes(week)
                          ? current.filter((value) => value !== week)
                          : [...current, week],
                      )
                    }
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink/[0.02] sm:px-5"
                  >
                    <span className="tabular w-16 shrink-0 text-sm font-medium">Week {week}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">
                      {weekItems.map((item) => item.skill).join(', ')}
                    </span>
                    <span className="tabular shrink-0 text-xs text-ink-faint">
                      {weekItems.reduce((sum, item) => sum + item.est_hours, 0)} hours
                    </span>
                    <ChevronDown
                      size={15}
                      className={cn(
                        'shrink-0 text-ink-faint transition-transform',
                        isOpen && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen ? (
                    <div className="divide-y border-t bg-canvas/60">
                      {weekItems.map((item) => (
                        <ItemLine key={item.id} item={item} onOpen={setOpen} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          Version {roadmap.roadmap.version}. Anything you change stays as you left it when the plan
          updates.
        </p>
        <Button variant="ghost" size="sm" onClick={generate} disabled={busy}>
          Rebuild from what is missing now
        </Button>
      </div>

      <ItemSheet
        item={open}
        busy={busy}
        onOpenChange={(next) => {
          if (!next) setOpen(null);
        }}
        onStatus={setStatus}
      />
    </div>
  );
}
