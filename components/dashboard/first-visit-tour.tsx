'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PROOF_LABEL, PROOF_MEANING } from '@/lib/wording';

const STORAGE_KEY = 'skillproof-tour-seen';

const STEPS = [
  {
    title: 'One number, and where it comes from',
    body: 'Your readiness is the share of what this role asks for that you can actually prove, weighted by how often each skill appears in real job posts. The bar under it is that score, one block per skill.',
  },
  {
    title: 'Three kinds of proof',
    body: `${PROOF_LABEL.claimed}: ${PROOF_MEANING.claimed} ${PROOF_LABEL.observed}: ${PROOF_MEANING.observed} ${PROOF_LABEL.verified}: ${PROOF_MEANING.verified}`,
  },
  {
    title: 'Always one next step',
    body: 'The blue card tells you the single most useful thing to do right now. Do that, and the score and the plan both update around it.',
  },
];

/** Teaches the three ideas the product depends on, once, then never again. */
export function FirstVisitTour() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setStep(0);
    } catch {
      // Blocked storage means the tour simply does not appear.
    }
  }, []);

  function dismiss() {
    setStep(null);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Nothing to do: the tour will show again next visit at worst.
    }
  }

  if (step === null) return null;
  const current = STEPS[step];
  if (!current) return null;
  const last = step === STEPS.length - 1;

  return (
    <aside className="rounded-panel border bg-surface px-5 py-4" aria-label="Quick introduction">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="tabular text-xs text-ink-faint">
            {step + 1} of {STEPS.length}
          </p>
          <h2 className="mt-1 text-base font-medium">{current.title}</h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">{current.body}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-control p-1.5 text-ink-faint transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          <X size={15} aria-hidden="true" />
          <span className="sr-only">Dismiss introduction</span>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => (last ? dismiss() : setStep(step + 1))}
        >
          {last ? 'Got it' : 'Next'}
        </Button>
        {!last ? (
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Skip
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
