'use client';

import { AlertTriangle, Check, Loader2, OctagonAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import type { AnalyzeStreamEvent } from '@/types/api';
import type { AgentLogLevel } from '@/types/domain';

type Step = { step: string; detail: string; level: AgentLogLevel };

const REDIRECT_DELAY_MS = 900;

/**
 * Consumes the Server Sent Events from the analyse route so the student watches
 * the agent work instead of a spinner. The steps shown here are the same rows
 * that end up in the agent trace on the dashboard.
 */
export function AnalysisStream({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
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
        if (!response.body) throw new Error('The server did not stream a response.');

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
            if (!payload) continue;
            const event = JSON.parse(payload) as AnalyzeStreamEvent;

            if (event.type === 'step') {
              setSteps((current) => [
                ...current,
                { step: event.step, detail: event.detail, level: event.level },
              ]);
            } else if (event.type === 'done') {
              setDone(true);
              setTimeout(() => router.replace(`/dashboard/${profileId}`), REDIRECT_DELAY_MS);
            } else {
              setError(event.message);
            }
          }
        }
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : 'The analysis could not be completed.');
      }
    }

    void run();
    return () => controller.abort();
  }, [profileId, router]);

  return (
    <Panel>
      <div className="flex items-center gap-3 border-b px-5 py-4">
        {error ? (
          <OctagonAlert size={18} className="text-danger-ink" aria-hidden="true" />
        ) : done ? (
          <Check size={18} className="text-observed-ink" aria-hidden="true" />
        ) : (
          <Loader2 size={18} className="animate-spin text-primary" aria-hidden="true" />
        )}
        <div>
          <h2 className="text-h3">
            {error ? 'Analysis stopped' : done ? 'Analysis complete' : 'Reading your evidence'}
          </h2>
          <p className="text-ui-sm text-muted" aria-live="polite">
            {error
              ? error
              : done
                ? 'Opening your dashboard.'
                : 'Resume, then public repositories, then the job description dataset.'}
          </p>
        </div>
      </div>

      <ol className="divide-y">
        {steps.map((entry, index) => (
          <li key={`${entry.step}-${index}`} className="flex gap-3 px-5 py-3">
            {entry.level === 'info' ? (
              <Check size={15} className="mt-0.5 shrink-0 text-observed-ink" aria-hidden="true" />
            ) : (
              <AlertTriangle
                size={15}
                className="mt-0.5 shrink-0 text-claimed-ink"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <p className="text-ui-sm font-medium">{entry.step}</p>
              <p className="break-words text-ui-sm text-muted">{entry.detail}</p>
            </div>
          </li>
        ))}
        {steps.length === 0 && !error ? (
          <li className="px-5 py-3 text-ui-sm text-muted">Starting the agent.</li>
        ) : null}
      </ol>

      {error ? (
        <div className="border-t px-5 py-4">
          <Button asChild variant="outline">
            <a href="/start">Start again</a>
          </Button>
        </div>
      ) : null}
    </Panel>
  );
}
