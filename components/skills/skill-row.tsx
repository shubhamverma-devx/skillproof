'use client';

import Link from 'next/link';
import { ProofBadge } from '@/components/ui/proof-badge';
import { ProofSeal } from '@/components/ui/proof-seal';
import { shortDemand } from '@/lib/wording';
import type { SkillAssessment } from '@/lib/scoring';
import type { EvidenceLevel } from '@/types/domain';
import { cn } from '@/lib/utils';

const BAR: Record<EvidenceLevel, string> = {
  verified: 'bg-verified',
  observed: 'bg-observed',
  claimed: 'bg-claimed',
  missing: 'bg-missing/40',
};

/** The one thing worth doing about this skill, given how far it has got. */
const ACTION: Record<EvidenceLevel, { label: string; route: 'quiz' | 'progress' }> = {
  verified: { label: 'Retake', route: 'quiz' },
  observed: { label: 'Test this', route: 'quiz' },
  claimed: { label: 'Test this', route: 'quiz' },
  missing: { label: 'Add proof', route: 'progress' },
};

/**
 * One skill. The bar is demand, the same number the label states, so the two
 * never disagree. How far the student has got is carried by the badge.
 */
export function SkillRow({
  skill,
  profileId,
  onOpen,
}: {
  skill: SkillAssessment;
  profileId: string;
  onOpen: (skill: SkillAssessment) => void;
}) {
  const action = ACTION[skill.level];
  const href =
    action.route === 'quiz'
      ? `/quiz/${profileId}?skill=${encodeURIComponent(skill.skill)}`
      : `/progress/${profileId}`;

  return (
    <div className="flex items-center transition-colors hover:bg-ink/[0.02]">
      <button
        type="button"
        onClick={() => onOpen(skill)}
        className="group flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left sm:px-5"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium group-hover:underline">{skill.skill}</span>
            {skill.level === 'verified' ? (
              <ProofSeal size={14} className="shrink-0 text-verified" />
            ) : null}
          </span>
          {/* The phone has no room for the bar, and the group heading already
              says the proof level, so the row carries the demand instead. */}
          <span className="tabular text-xs text-ink-faint sm:hidden">
            {shortDemand(skill.frequency)}
          </span>
        </span>

        <span className="hidden w-44 items-center gap-2 sm:flex">
          <span className="h-1.5 flex-1 rounded-full bg-ink/[0.07]">
            <span
              className={cn('block h-full rounded-full', BAR[skill.level])}
              style={{ width: `${Math.round(skill.frequency * 100)}%` }}
            />
          </span>
          <span className="tabular w-24 shrink-0 text-right text-xs text-ink-faint">
            {shortDemand(skill.frequency)}
          </span>
        </span>

        <ProofBadge
          level={skill.level}
          showIcon={false}
          className="hidden shrink-0 sm:inline-flex"
        />
        <span className="sr-only">. Open the evidence behind this skill.</span>
      </button>

      <Link
        href={href}
        className="mr-3 shrink-0 rounded-control border px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink sm:mr-4"
      >
        {action.label}
        <span className="sr-only"> {skill.skill}</span>
      </Link>
    </div>
  );
}
