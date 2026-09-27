'use client';

import { Panel } from '@/components/ui/panel';
import { readinessMeaning, scoreHeadline } from '@/lib/wording';
import type { SkillAssessment } from '@/lib/scoring';
import { cn } from '@/lib/utils';
import { MeterLegend, ProofMeter } from './proof-meter';
import { useCountUp } from './use-count-up';

/**
 * The headline of the whole product: a sentence first, the number inside it, and
 * one line underneath saying what it means for this student.
 */
export function ScoreCard({
  score,
  ceiling,
  previousScore,
  roleName,
  assessments,
  githubOnly,
}: {
  score: number;
  ceiling: number;
  previousScore: number | null;
  roleName: string;
  assessments: SkillAssessment[];
  githubOnly: boolean;
}) {
  const animated = useCountUp(score, previousScore ?? 0);
  const delta = previousScore === null ? null : Math.round((score - previousScore) * 10) / 10;

  return (
    <Panel className="px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-2xl">
          You are{' '}
          {/* Width is reserved for the final score so counting up cannot rewrap the line. */}
          <span
            className="tabular inline-block font-mono tracking-tight"
            style={{ minWidth: `${String(Math.round(score)).length + 1}ch` }}
          >
            {Math.round(animated)}%
          </span>{' '}
          ready for {roleName} roles.
        </h2>
        {delta !== null && delta !== 0 ? (
          <span
            className={cn(
              'tabular rounded-full px-2 py-0.5 text-xs font-medium',
              delta > 0 ? 'bg-verified-soft/10 text-verified' : 'bg-claimed-soft/12 text-claimed',
            )}
          >
            {delta > 0 ? '+' : ''}
            {delta} since your last update
          </span>
        ) : null}
      </div>

      <p className="mt-2 max-w-prose text-sm text-ink-muted">
        {readinessMeaning(score, ceiling, roleName)}
      </p>

      <div className="mt-5">
        <ProofMeter score={score} previousScore={previousScore} assessments={assessments} />
        <MeterLegend className="mt-2.5" />
      </div>

      {githubOnly ? (
        <p className="mt-4 rounded-control border bg-canvas px-3.5 py-2.5 text-sm text-ink-muted">
          <span className="font-medium text-ink">This is based on your code alone.</span> We found
          nothing usable on your resume and you have not taken a test yet, so add either one to
          prove more.
        </p>
      ) : null}

      <span className="sr-only">
        {scoreHeadline(score, roleName)} {readinessMeaning(score, ceiling, roleName)}
      </span>
    </Panel>
  );
}
