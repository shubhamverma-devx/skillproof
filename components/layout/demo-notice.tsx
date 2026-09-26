import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Recorded output must never be mistaken for a live call, so it is labelled. */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-panel border bg-surface px-4 py-3 text-sm',
        className,
      )}
    >
      <Info size={15} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
      <p className="max-w-prose text-ink-muted">
        <span className="font-medium text-ink">This is a sample student.</span> Riya Sharma is made
        up. Her GitHub scan and the written explanations are replayed from a recording, so nothing
        here is a live API call.
      </p>
    </div>
  );
}
