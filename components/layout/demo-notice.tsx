import { Info } from 'lucide-react';

/** Demo mode must never be mistaken for live output, so it is labelled in place. */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-panel border border-claimed/35 bg-claimed/[0.08] px-4 py-3 text-ui-sm ${className ?? ''}`}
    >
      <Info size={16} className="mt-0.5 shrink-0 text-claimed-ink" aria-hidden="true" />
      <p className="max-w-prose">
        <span className="font-medium">Demo profile.</span> Riya Sharma is a seeded student. Her
        GitHub scan is replayed from a cached copy in this repository and language model replies come
        from the recorded cache or the deterministic planner, so nothing here is a live API call.
      </p>
    </div>
  );
}
