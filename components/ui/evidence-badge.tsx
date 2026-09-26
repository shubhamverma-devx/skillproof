import { Check, CircleDashed, FileText, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EvidenceLevel } from '@/types/domain';

const LEVELS: Record<
  EvidenceLevel,
  { label: string; className: string; Icon: typeof Check; title: string }
> = {
  verified: {
    label: 'Verified',
    className: 'bg-verified/12 text-verified-ink',
    Icon: Check,
    title: 'Passed a quiz on this skill',
  },
  observed: {
    label: 'Observed',
    className: 'bg-observed/12 text-observed-ink',
    Icon: GitBranch,
    title: 'Found in your GitHub code',
  },
  claimed: {
    label: 'Claimed',
    className: 'bg-claimed/14 text-claimed-ink',
    Icon: FileText,
    title: 'Listed on your resume only',
  },
  missing: {
    label: 'No evidence',
    className: 'bg-missing/25 text-missing-ink',
    Icon: CircleDashed,
    title: 'Not found on your resume or in your code',
  },
};

export function EvidenceBadge({
  level,
  className,
}: {
  level: EvidenceLevel;
  className?: string;
}) {
  const { label, className: tone, Icon, title } = LEVELS[level];
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.8125rem] font-medium',
        tone,
        className,
      )}
    >
      <Icon size={13} strokeWidth={2.25} aria-hidden="true" />
      {label}
    </span>
  );
}

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  verified: LEVELS.verified.label,
  observed: LEVELS.observed.label,
  claimed: LEVELS.claimed.label,
  missing: LEVELS.missing.label,
};
