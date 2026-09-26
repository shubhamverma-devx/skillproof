'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader, PanelNote, PanelTitle } from '@/components/ui/panel';
import { patchJson, postJson } from '@/lib/client/api';
import type { ProfileState, ProgressResult } from '@/types/api';
import type { RoadmapItem, RoadmapItemStatus } from '@/types/domain';
import { ChangesBox } from './changes-box';
import { RoadmapItemRow } from './roadmap-item-row';

type PatchResponse = { item: RoadmapItem; progress: ProgressResult | null };

export function RoadmapView({ state }: { state: ProfileState }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [dragged, setDragged] = useState<{ week: number; id: string } | null>(null);

  const roadmap = state.roadmap;
  const items = roadmap?.items ?? [];
  const weeks = [...new Set(items.map((item) => item.week))].sort((a, b) => a - b);

  async function generate() {
    setBusy(true);
    const response = await postJson(`/api/roadmap/${state.profile.id}/generate`, {});
    setBusy(false);
    if ('error' in response) {
      toast.error(response.error);
      return;
    }
    toast.success('Roadmap generated');
    router.refresh();
  }

  async function approve() {
    setBusy(true);
    const response = await postJson(`/api/roadmap/${state.profile.id}/approve`, {});
    setBusy(false);
    if ('error' in response) {
      toast.error(response.error);
      return;
    }
    toast.success('Roadmap approved');
    router.refresh();
  }

  async function patchItem(itemId: string, patch: Record<string, unknown>, message: string) {
    setBusy(true);
    const response = await patchJson<PatchResponse>(`/api/roadmap/item/${itemId}`, patch);
    setBusy(false);
    if ('error' in response) {
      toast.error(response.error);
      return;
    }
    toast.success(message);
    if (response.data.progress) {
      setChanges(response.data.progress.changes);
      setSummary(response.data.progress.summary);
    }
    router.refresh();
  }

  async function reorder(week: number, fromId: string, toId: string) {
    const inWeek = items.filter((item) => item.week === week);
    const from = inWeek.findIndex((item) => item.id === fromId);
    const to = inWeek.findIndex((item) => item.id === toId);
    if (from === -1 || to === -1 || from === to) return;

    const reordered = [...inWeek];
    const [moved] = reordered.splice(from, 1);
    if (moved) reordered.splice(to, 0, moved);

    setBusy(true);
    for (const [index, item] of reordered.entries()) {
      if (item.order_index === index) continue;
      await patchJson(`/api/roadmap/item/${item.id}`, { order_index: index });
    }
    setBusy(false);
    toast.success('Order updated');
    router.refresh();
  }

  if (!roadmap || items.length === 0) {
    return (
      <Panel className="px-5 py-8 text-center">
        <h2 className="text-h3">No roadmap yet</h2>
        <p className="mx-auto mt-2 max-w-prose text-ui-sm text-muted">
          The plan is built from your ranked gaps, your {state.profile.weekly_hours} hour weekly
          budget and the prerequisites between skills. You can edit every item afterwards.
        </p>
        <Button className="mt-5" onClick={generate} disabled={busy}>
          {busy ? 'Building your roadmap' : 'Build my roadmap'}
        </Button>
      </Panel>
    );
  }

  const totalHours = items.reduce((sum, item) => sum + item.est_hours, 0);
  const doneCount = items.filter((item) => item.status === 'done').length;

  return (
    <div className="flex flex-col gap-4">
      {roadmap.roadmap.status === 'draft' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-claimed/40 bg-claimed/[0.08] px-4 py-3">
          <p className="max-w-prose text-ui-sm">
            <span className="font-medium">Review and approve your roadmap.</span> Nothing is fixed
            until you approve it. Reorder, edit the hours or skip anything that does not fit.
          </p>
          <Button onClick={approve} disabled={busy}>
            Approve roadmap
          </Button>
        </div>
      ) : null}

      <ChangesBox changes={changes} summary={summary} />

      <Panel>
        <PanelHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div>
            <PanelTitle>
              Version {roadmap.roadmap.version}, {roadmap.roadmap.status === 'approved' ? 'approved' : 'draft'}
            </PanelTitle>
            <PanelNote>
              {items.length} items, {weeks.length} weeks, {totalHours} hours in total, {doneCount}{' '}
              done. No week goes past your {state.profile.weekly_hours} hour budget.
            </PanelNote>
          </div>
          <Button variant="outline" onClick={generate} disabled={busy} className="shrink-0">
            Rebuild from current gaps
          </Button>
        </PanelHeader>

        <ol className="divide-y">
          {weeks.map((week) => {
            const weekItems = items.filter((item) => item.week === week);
            const hours = weekItems.reduce((sum, item) => sum + item.est_hours, 0);
            return (
              <li key={week} className="grid gap-0 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                <div className="flex items-baseline gap-2 border-b px-4 py-3 sm:block sm:border-b-0 sm:border-r sm:px-5">
                  <p className="font-display text-ui font-semibold">Week {week}</p>
                  <p className="tabular text-ui-sm text-muted">{hours} hours</p>
                </div>
                <div className="divide-y">
                  {weekItems.map((item, index) => (
                    <RoadmapItemRow
                      key={item.id}
                      item={item}
                      busy={busy}
                      canMoveUp={index > 0}
                      canMoveDown={index < weekItems.length - 1}
                      onStatusChange={(status: RoadmapItemStatus) =>
                        patchItem(item.id, { status }, `Marked as ${status}`)
                      }
                      onEdit={(patch) => {
                        const cleaned = Object.fromEntries(
                          Object.entries(patch).filter(([, value]) => value !== undefined),
                        );
                        if (Object.keys(cleaned).length === 0) return;
                        void patchItem(item.id, cleaned, 'Item updated');
                      }}
                      onMove={(direction) => {
                        const target = weekItems[index + direction];
                        if (target) void reorder(week, item.id, target.id);
                      }}
                      dragHandlers={{
                        onDragStart: () => setDragged({ week, id: item.id }),
                        onDragOver: (event) => {
                          if (dragged?.week === week) event.preventDefault();
                        },
                        onDrop: () => {
                          if (dragged && dragged.week === week) void reorder(week, dragged.id, item.id);
                          setDragged(null);
                        },
                      }}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}
