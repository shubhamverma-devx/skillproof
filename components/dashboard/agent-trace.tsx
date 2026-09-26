'use client';

import { AlertTriangle, ChevronDown, Info, OctagonAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatClock } from '@/lib/utils';
import type { AgentLog } from '@/types/domain';

const ICON = {
  info: { Icon: Info, className: 'text-muted' },
  warn: { Icon: AlertTriangle, className: 'text-claimed-ink' },
  error: { Icon: OctagonAlert, className: 'text-danger-ink' },
} as const;

/**
 * Every step the agent took, including the ones that failed. Judges and students
 * can both see where a number came from and what the agent did when something
 * was unavailable.
 */
export function AgentTrace({ logs }: { logs: AgentLog[] }) {
  const [open, setOpen] = useState(true);
  const warnings = logs.filter((log) => log.level !== 'info').length;
  const shown = [...logs].reverse();

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-h3">Agent trace</h2>
          <p className="text-ui-sm text-muted">
            {logs.length} steps{warnings > 0 ? `, ${warnings} needed a fallback` : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-controls="agent-trace-list"
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown
            size={16}
            className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
            aria-hidden="true"
          />
          <span className="sr-only">{open ? 'Collapse agent trace' : 'Expand agent trace'}</span>
        </Button>
      </div>

      {open ? (
        <ol id="agent-trace-list" className="max-h-[28rem] divide-y overflow-y-auto">
          {shown.length === 0 ? (
            <li className="px-5 py-4 text-ui-sm text-muted">No steps recorded yet.</li>
          ) : (
            shown.map((log) => {
              const { Icon, className } = ICON[log.level];
              return (
                <li key={log.id} className="flex gap-3 px-5 py-3">
                  <Icon size={15} className={`mt-0.5 shrink-0 ${className}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-ui-sm font-medium">{log.step}</p>
                    <p className="break-words text-ui-sm text-muted">{log.detail}</p>
                    <p className="tabular mt-0.5 text-[0.8125rem] text-muted/80">
                      {formatClock(log.created_at)}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ol>
      ) : null}
    </>
  );
}
