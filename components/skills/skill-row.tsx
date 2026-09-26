'use client';

import { ChevronRight } from 'lucide-react';
import { ProofBadge } from '@/components/ui/proof-badge';
import { ProofSeal } from '@/components/ui/proof-seal';
import { shortDemand } from '@/lib/wording';
import type { SkillAssessment } from '@/lib/scoring';
import { cn } from '@/lib/utils';

const BAR: Record<string, string> = {
  verified: 'bg-verified',
  observed: 'bg-observed',
  claimed: 'bg-claimed',
  missing: 'bg-missing/40',
};

/** One skill. The whole row opens the detail sheet, so there is one target. */
export function SkillRow({
  skill,
  onOpen,
}: {
  skill: SkillAssessment;
  onOpen: (skill: SkillAssessment) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(skill)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink/[0.02] sm:px-5"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-medium">{skill.skill}</span>
        {skill.level === 'verified' ? (
          <ProofSeal size={14} className="shrink-0 text-verified" />
        ) : null}
      </span>

      <span className="hidden w-44 items-center gap-2 sm:flex">
        <span className="h-1.5 flex-1 rounded-full bg-ink/[0.07]">
          <span
            className={cn('block h-full rounded-full', BAR[skill.level])}
            style={{ width: `${Math.max(skill.proficiency, 0.04) * 100}%` }}
          />
        </span>
        <span className="tabular w-24 shrink-0 text-right text-xs text-ink-faint">
          {shortDemand(skill.frequency)}
        </span>
      </span>

      <ProofBadge level={skill.level} showIcon={false} className="shrink-0" />
      <ChevronRight size={15} className="shrink-0 text-ink-faint" aria-hidden="true" />
    </button>
  );
}
