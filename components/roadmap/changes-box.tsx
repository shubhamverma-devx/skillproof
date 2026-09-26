import { ArrowRightLeft } from 'lucide-react';

/** Shown after a replan so the student can see exactly what the agent moved. */
export function ChangesBox({ changes, summary }: { changes: string[]; summary: string | null }) {
  if (changes.length === 0 && !summary) return null;

  return (
    <div className="rounded-panel border border-primary/30 bg-primary/[0.05] px-4 py-3">
      <div className="flex items-center gap-2">
        <ArrowRightLeft size={15} className="text-primary" aria-hidden="true" />
        <h2 className="text-ui font-medium">What changed</h2>
      </div>
      {summary ? <p className="mt-1 text-ui-sm">{summary}</p> : null}
      {changes.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ui-sm text-muted">
          {changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-ui-sm text-muted">
          The plan order did not change. Your remaining weeks are still the best use of your time.
        </p>
      )}
    </div>
  );
}
