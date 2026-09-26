'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ProofBadge } from '@/components/ui/proof-badge';
import { PROOF_MEANING, demandPhrase } from '@/lib/wording';
import type { SkillAssessment } from '@/lib/scoring';

/** The full story behind one skill, including the file that proved it. */
export function SkillSheet({
  skill,
  profileId,
  onOpenChange,
}: {
  skill: SkillAssessment | null;
  profileId: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={skill !== null} onOpenChange={onOpenChange}>
      {skill ? (
        <SheetContent title={skill.skill} subtitle={demandPhrase(skill.frequency)}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <ProofBadge level={skill.level} />
              {skill.tested ? (
                <span className="tabular text-sm text-ink-muted">
                  You scored {Math.round((skill.verified_score ?? 0) * 100)}% when tested
                </span>
              ) : null}
            </div>

            <section>
              <h3 className="text-sm font-medium">What this means</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{PROOF_MEANING[skill.level]}</p>
            </section>

            {skill.observed_sources.length > 0 ? (
              <section>
                <h3 className="text-sm font-medium">Where we found it</h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {skill.observed_sources.slice(0, 8).map((source, index) => (
                    <li
                      key={`${source.repo}-${source.file}-${index}`}
                      className="rounded-control border bg-canvas px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-xs text-ink">{source.repo}</span>
                      <p className="mt-0.5 text-ink-muted">{source.hint}</p>
                    </li>
                  ))}
                </ul>
                {skill.observed_sources.length > 8 ? (
                  <p className="mt-2 text-xs text-ink-faint">
                    and {skill.observed_sources.length - 8} more files
                  </p>
                ) : null}
              </section>
            ) : null}

            <section>
              <h3 className="text-sm font-medium">Why it counts</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{skill.evidence_summary}</p>
            </section>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={`/quiz/${profileId}?skill=${encodeURIComponent(skill.skill)}`}>
                  {skill.tested ? 'Take the test again' : `Test me on ${skill.skill}`}
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/progress/${profileId}`}>Link a project</Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
