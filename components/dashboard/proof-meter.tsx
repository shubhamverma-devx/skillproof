'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PROOF_LABEL, demandPhrase } from '@/lib/wording';
import type { SkillAssessment } from '@/lib/scoring';
import { cn } from '@/lib/utils';
import { useCountUp, useMounted } from './use-count-up';

const FILL: Record<string, string> = {
  verified: 'bg-verified',
  observed: 'bg-observed',
  claimed: 'bg-claimed',
  missing: 'bg-missing/35',
};

/**
 * One bar for the whole score. Each segment is a skill the role asks for, its
 * width is how often jobs ask for it, and the fill is how much of it the student
 * has shown. The legend below says that in words, because the shape alone does
 * not teach it.
 */
export function ProofMeter({
  score,
  previousScore,
  assessments,
}: {
  score: number;
  previousScore: number | null;
  assessments: SkillAssessment[];
}) {
  const mounted = useMounted();
  const animated = useCountUp(score, previousScore ?? 0);
  const segments = assessments.filter((assessment) => assessment.frequency > 0);

  return (
    <TooltipProvider delayDuration={120}>
      <div
        className="flex h-11 w-full gap-px overflow-hidden rounded-control"
        role="img"
        aria-label={`${Math.round(animated)} out of 100, across ${segments.length} skills this role asks for`}
      >
        {segments.map((segment, index) => (
          <Tooltip key={segment.skill}>
            <TooltipTrigger asChild>
              <button
                type="button"
                style={{ flexGrow: segment.frequency }}
                className="group relative h-full min-w-[3px] bg-ink/[0.06] transition-opacity hover:opacity-80 focus-visible:outline-offset-0"
                aria-label={`${segment.skill}, ${demandPhrase(segment.frequency)}, ${PROOF_LABEL[segment.level]}`}
              >
                <span
                  className={cn(
                    'absolute bottom-0 left-0 w-full transition-[height]',
                    FILL[segment.level],
                  )}
                  style={{
                    height: mounted ? `${segment.proficiency * 100}%` : '0%',
                    transitionDuration: '700ms',
                    transitionDelay: `${Math.min(index * 30, 360)}ms`,
                  }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{segment.skill}</p>
              <p className="mt-0.5 text-ink-muted">{demandPhrase(segment.frequency)}</p>
              <p className="text-ink-muted">{PROOF_LABEL[segment.level]}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export function MeterLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-faint',
        className,
      )}
    >
      <span>Each block is a skill. Wider means more jobs ask for it.</span>
      <span className="flex items-center gap-3">
        <Key className="bg-verified" label={PROOF_LABEL.verified} />
        <Key className="bg-observed" label={PROOF_LABEL.observed} />
        <Key className="bg-claimed" label={PROOF_LABEL.claimed} />
        <Key className="bg-missing/35" label={PROOF_LABEL.missing} />
      </span>
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-[3px]', className)} />
      {label}
    </span>
  );
}
