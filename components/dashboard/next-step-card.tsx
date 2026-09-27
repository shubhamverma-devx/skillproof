import { ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { NextStep } from '@/lib/next-step';

/** The only primary button on the Overview page. */
export function NextStepCard({ step }: { step: NextStep }) {
  return (
    <section className="rounded-panel border border-accent/25 bg-accent/[0.04] px-5 py-5 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">Do this next</p>
      <h2 className="mt-1.5 text-lg">{step.title}</h2>
      <p className="mt-1.5 max-w-prose text-sm text-ink-muted">{step.body}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href={step.href}>
            {step.action}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </Button>
        <span className="flex items-center gap-1.5 text-sm text-ink-faint">
          <Clock size={14} aria-hidden="true" />
          {step.effort}
        </span>
      </div>
    </section>
  );
}
