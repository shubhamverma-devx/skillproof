'use client';

import { ProofSeal } from '@/components/ui/proof-seal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EVIDENCE_LABEL } from '@/components/ui/evidence-badge';
import type { SkillAssessment } from '@/lib/scoring';
import { cn, formatPercent } from '@/lib/utils';
import { useCountUp, useMounted } from './use-count-up';

const FILL_CLASS: Record<string, string> = {
  verified: 'bg-verified',
  observed: 'bg-observed',
  claimed: 'bg-claimed',
  missing: 'bg-missing',
};

/**
 * One segment per role skill, width proportional to how often job descriptions
 * ask for it, fill colour showing the evidence level and fill amount showing
 * proficiency. The whole readiness score is visible as one shape.
 */
export function ProofMeter({
  score,
  ceiling,
  evidenceMix,
  previousScore,
  assessments,
  roleName,
}: {
  score: number;
  ceiling: number;
  evidenceMix: { claimed: number; observed: number; tested: number };
  previousScore: number | null;
  assessments: SkillAssessment[];
  roleName: string;
}) {
  const mounted = useMounted();
  const delta = previousScore === null ? null : Math.round((score - previousScore) * 10) / 10;
  const animated = useCountUp(score, previousScore ?? 0);
  const segments = assessments.filter((assessment) => assessment.frequency > 0);
  const verifiedCount = assessments.filter((assessment) => assessment.level === 'verified').length;

  // Only code evidence, nothing claimed and nothing verified.
  const githubOnly =
    evidenceMix.observed > 0 && evidenceMix.claimed === 0 && evidenceMix.tested === 0;
  const headroom = Math.round((ceiling - score) * 10) / 10;

  return (
    <div className="px-5 py-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="text-ui-sm text-muted">Readiness for {roleName}</p>
          <div className="flex items-baseline gap-2">
            <span className="tabular font-display text-display font-bold leading-none">
              {Math.round(animated)}
            </span>
            <span className="text-h3 text-muted">/ 100</span>
          </div>
        </div>

        <div className="ml-auto flex flex-col items-start gap-1 sm:items-end">
          {delta !== null && delta !== 0 ? (
            <span
              className={cn(
                'tabular rounded-full px-2 py-0.5 text-ui-sm font-medium',
                delta > 0 ? 'bg-observed/12 text-observed-ink' : 'bg-claimed/14 text-claimed-ink',
              )}
            >
              {delta > 0 ? '+' : ''}
              {delta} since your last update
            </span>
          ) : null}
          <span className="flex items-center gap-1.5 text-ui-sm text-muted">
            <ProofSeal size={16} className="text-verified" />
            {verifiedCount} of {segments.length} skills verified by quiz
          </span>
          {headroom >= 0.5 ? (
            <span className="tabular text-ui-sm text-muted">
              Proving what you already show would reach{' '}
              <span className="font-semibold text-ink">{Math.round(ceiling)}</span>
            </span>
          ) : null}
        </div>
      </div>

      <TooltipProvider delayDuration={120}>
        <div
          className="mt-5 flex h-14 w-full gap-[2px] overflow-hidden rounded-inner"
          role="img"
          aria-label={`Readiness ${Math.round(score)} out of 100 across ${segments.length} skills that ${roleName} job descriptions ask for`}
        >
          {segments.map((segment, index) => (
            <Tooltip key={segment.skill}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  style={{ flexGrow: segment.frequency }}
                  className="group relative h-full min-w-[3px] bg-missing/30 focus-visible:outline-offset-0"
                  aria-label={`${segment.skill}: ${formatPercent(segment.frequency)} of job descriptions, ${EVIDENCE_LABEL[segment.level].toLowerCase()}, proficiency ${formatPercent(segment.proficiency)}`}
                >
                  <span
                    className={cn(
                      'absolute bottom-0 left-0 w-full transition-[height] duration-700 ease-out group-hover:opacity-85',
                      FILL_CLASS[segment.level],
                    )}
                    style={{
                      height: mounted ? `${Math.max(segment.proficiency * 100, 0)}%` : '0%',
                      transitionDelay: `${Math.min(index * 35, 420)}ms`,
                    }}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{segment.skill}</p>
                <p className="tabular mt-0.5 text-muted">
                  In {formatPercent(segment.frequency)} of job descriptions
                </p>
                <p className="tabular text-muted">
                  {EVIDENCE_LABEL[segment.level]}, proficiency {formatPercent(segment.proficiency)}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {githubOnly ? (
        <p className="mt-3 rounded-inner border border-claimed/35 bg-claimed/[0.08] px-3 py-2 text-ui-sm">
          Based on GitHub only. Add your resume or take quizzes to prove more.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-muted">
        <span>Segment width is how often job descriptions ask for the skill.</span>
        <span className="flex items-center gap-3">
          <Legend className="bg-verified" label="Verified" />
          <Legend className="bg-observed" label="Observed" />
          <Legend className="bg-claimed" label="Claimed" />
          <Legend className="bg-missing" label="None" />
        </span>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-sm', className)} />
      {label}
    </span>
  );
}
