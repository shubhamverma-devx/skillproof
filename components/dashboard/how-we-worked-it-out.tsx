'use client';

import { AlertTriangle, ChevronDown, Info, OctagonAlert } from 'lucide-react';
import { useState } from 'react';
import { Panel } from '@/components/ui/panel';
import { formatClock } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { AgentLog } from '@/types/domain';

const ICON = {
  info: { Icon: Info, className: 'text-ink-faint' },
  warn: { Icon: AlertTriangle, className: 'text-claimed' },
  error: { Icon: OctagonAlert, className: 'text-danger' },
} as const;

/**
 * Every step taken to produce the score, including the ones that failed. It is
 * collapsed by default: it is proof that the number is not made up, not the
 * first thing a student needs.
 */
export function HowWeWorkedItOut({ logs }: { logs: AgentLog[] }) {
  const [open, setOpen] = useState(false);
  const fallbacks = logs.filter((log) => log.level !== 'info').length;

  return (
    <Panel>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="agent-steps"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span>
          <span className="block text-lg">How we worked this out</span>
          <span className="tabular mt-0.5 block text-sm text-ink-muted">
            {logs.length} steps{fallbacks > 0 ? `, ${fallbacks} needed a backup plan` : ''}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-ink-faint transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ol id="agent-steps" className="max-h-96 overflow-y-auto border-t">
          {logs.length === 0 ? (
            <li className="px-5 py-4 text-sm text-ink-muted">No steps recorded yet.</li>
          ) : (
            [...logs].reverse().map((log) => {
              const { Icon, className } = ICON[log.level];
              return (
                <li key={log.id} className="flex gap-3 border-b px-5 py-3 last:border-b-0">
                  <Icon size={14} className={cn('mt-1 shrink-0', className)} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{log.step}</p>
                    <p className="break-words text-sm text-ink-muted">{log.detail}</p>
                    <p className="tabular mt-0.5 text-xs text-ink-faint">
                      {formatClock(log.created_at)}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ol>
      ) : null}
    </Panel>
  );
}
