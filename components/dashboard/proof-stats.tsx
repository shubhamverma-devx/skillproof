import Link from 'next/link';
import { PROOF_LABEL, PROOF_MEANING } from '@/lib/wording';
import type { SkillAssessment } from '@/lib/scoring';
import type { EvidenceLevel } from '@/types/domain';

const SHOWN: EvidenceLevel[] = ['verified', 'observed', 'missing'];

const ACCENT: Record<string, string> = {
  verified: 'text-verified',
  observed: 'text-observed',
  missing: 'text-missing',
};

/** Three counts that answer "where do I stand", each a way into the skills list. */
export function ProofStats({
  assessments,
  profileId,
}: {
  assessments: SkillAssessment[];
  profileId: string;
}) {
  const roleSkills = assessments.filter((assessment) => assessment.frequency > 0);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
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
