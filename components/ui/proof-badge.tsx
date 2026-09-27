import { Check, CircleDashed, FileText, FolderGit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PROOF_LABEL, PROOF_MEANING } from '@/lib/wording';
import { cn } from '@/lib/utils';
import type { EvidenceLevel } from '@/types/domain';

const ICON = {
  verified: Check,
  observed: FolderGit2,
  claimed: FileText,
  missing: CircleDashed,
} as const;

/** The proof state of one skill, in the words the student reads everywhere. */
export function ProofBadge({
  level,
  className,
  showIcon = true,
}: {
  level: EvidenceLevel;
  className?: string;
  showIcon?: boolean;
}) {
  const Icon = ICON[level];
  return (
    <Badge tone={level} title={PROOF_MEANING[level]} className={cn(className)}>
      {showIcon ? <Icon size={12} strokeWidth={2.5} aria-hidden="true" /> : null}
      {PROOF_LABEL[level]}
    </Badge>
  );
}
