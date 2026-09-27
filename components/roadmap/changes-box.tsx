import { ArrowRightLeft } from 'lucide-react';

/** Shown after the plan rebuilds, so a change never happens silently. */
export function ChangesBox({ changes, summary }: { changes: string[]; summary: string | null }) {
  if (changes.length === 0 && !summary) return null;

  return (
    <section className="rounded-panel border bg-surface px-5 py-4">
      <div className="flex items-center gap-2">
        <ArrowRightLeft size={14} className="text-accent" aria-hidden="true" />
        <h2 className="text-base font-medium">What changed</h2>
      </div>
      {summary ? <p className="mt-1.5 text-sm">{summary}</p> : null}
      {changes.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {changes.map((change) => (
            <li key={change} className="flex gap-2 text-sm text-ink-muted">
              <span
                aria-hidden="true"
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint"
              />
              {change}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-sm text-ink-muted">
          The order did not change. Your remaining weeks are still the best use of your time.
        </p>
      )}
    </section>
  );
}
