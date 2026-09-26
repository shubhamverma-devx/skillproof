'use client';

import { Check, Loader2, OctagonAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { cn } from '@/lib/utils';
import type { AnalyzeStreamEvent } from '@/types/api';

type Stage = { label: string; match: (step: string) => boolean };

/**
 * The agent's steps are named for engineers. A student sees four plain stages
 * instead, with the raw detail kept for the Overview page.
 */
const STAGES: Stage[] = [
  { label: 'Reading your resume', match: (s) => s.startsWith('Resume') || s === 'Agent started' },
  {
    label: 'Looking through your projects',
    match: (s) =>
      s.includes('GitHub') ||
      s.includes('Repositories') ||
      s.includes('Skill observed') ||
      s.includes('Code evidence'),
  },
  {
    label: 'Comparing with real job posts',
    match: (s) => s.includes('Claimed skills') || s.includes('Quiz results'),
  },
  {
    label: 'Working out your score',
    match: (s) => s.includes('Readiness') || s.includes('Top gaps'),
  },
];

export function AnalysisStream({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [reached, setReached] = useState(0);
  const [detail, setDetail] = useState('Starting up');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const controller = new AbortController();

    async function run() {
      try {
        const response = await fetch(`/api/analyze/${profileId}`, {
          method: 'POST',
          signal: controller.signal,
        });
        if (!response.body) throw new Error('The server did not send anything back.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { done: finished, value } = await reader.read();
          if (finished) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';

          for (const chunk of chunks) {
            const payload = chunk.replace(/^data: /, '').trim();
            if (!payload || payload.startsWith(':')) continue;
            const event = JSON.parse(payload) as AnalyzeStreamEvent;

            if (event.type === 'step') {
              const index = STAGES.findIndex((stage) => stage.match(event.step));
              if (index >= 0) setReached((current) => Math.max(current, index));
              setDetail(event.detail);
            } else if (event.type === 'done') {
              setReached(STAGES.length);
              setDone(true);
              setTimeout(() => router.replace(`/dashboard/${profileId}`), 700);
            } else {
              setError(event.message);
            }
          }
        }
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : 'We could not finish the analysis.');
      }
    }

    void run();
    return () => controller.abort();
  }, [profileId, router]);

  const percent = Math.round((Math.min(reached, STAGES.length) / STAGES.length) * 100);

  if (error) {
    return (
      <Panel className="px-5 py-6">
        <div className="flex items-start gap-3">
          <OctagonAlert size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <h2 className="text-lg">We could not finish</h2>
            <p className="mt-1 max-w-prose text-sm text-ink-muted">{error}</p>
            <Button asChild variant="secondary" className="mt-4">
              <a href="/start">Start again</a>
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="px-5 py-6">
      <div className="flex items-center gap-2.5">
        {done ? (
          <Check size={18} className="text-verified" aria-hidden="true" />
        ) : (
          <Loader2 size={18} className="animate-spin text-accent" aria-hidden="true" />
        )}
        <h2 className="text-lg">{done ? 'All done' : 'Working through your profile'}</h2>
      </div>

      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${Math.max(percent, 6)}%` }}
        />
      </div>

      <ol className="mt-5 flex flex-col gap-3">
        {STAGES.map((stage, index) => {
          const state = index < reached ? 'done' : index === reached ? 'active' : 'waiting';
          return (
            <li key={stage.label} className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs',
                  state === 'done' && 'border-verified bg-verified text-surface',
                  state === 'active' && 'border-accent text-accent',
                  state === 'waiting' && 'border-line text-ink-faint',
                )}
                aria-hidden="true"
              >
                {state === 'done' ? <Check size={11} strokeWidth={3} /> : index + 1}
              </span>
              <span className={cn('text-sm', state === 'waiting' ? 'text-ink-faint' : 'text-ink')}>
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 truncate text-xs text-ink-faint" aria-live="polite">
        {done ? 'Opening your overview' : detail}
      </p>
    </Panel>
  );
}
