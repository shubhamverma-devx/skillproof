import Link from 'next/link';
import { PROOF_LABEL, PROOF_MEANING } from '@/lib/wording';
import type { SkillAssessment } from '@/lib/scoring';
import type { EvidenceLevel } from '@/types/domain';

const SHOWN: EvidenceLevel[] = ['verified', 'observed', 'claimed', 'missing'];

const ACCENT: Record<string, string> = {
  verified: 'text-verified',
  observed: 'text-observed',
  claimed: 'text-claimed',
  missing: 'text-missing',
};

/**
 * One count per proof state, so the four numbers add up to every skill the role
 * asks for, and each one is a way into the filtered skills list.
 */
export function ProofStats({
  assessments,
  profileId,
}: {
  assessments: SkillAssessment[];
  profileId: string;
}) {
  const roleSkills = assessments.filter((assessment) => assessment.frequency > 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {SHOWN.map((level) => {
        const count = roleSkills.filter((assessment) => assessment.level === level).length;
        return (
          <Link
            key={level}
            href={`/skills/${profileId}?show=${level}`}
            className="rounded-panel border bg-surface px-4 py-4 transition-colors hover:bg-ink/[0.02]"
          >
            <p className={`tabular font-mono text-2xl ${ACCENT[level]}`}>{count}</p>
            <p className="mt-0.5 text-sm font-medium">{PROOF_LABEL[level]}</p>
            <p className="mt-0.5 text-xs text-ink-faint">{PROOF_MEANING[level]}</p>
          </Link>
        );
      })}
    </div>
  );
}
