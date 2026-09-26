import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EvidenceBadge } from '@/components/ui/evidence-badge';
import { PanelHeader, PanelNote, PanelTitle } from '@/components/ui/panel';
import type { SkillAssessment } from '@/lib/scoring';
import { formatPercent } from '@/lib/utils';

export function TopGaps({
  gaps,
  profileId,
  hasRoadmap,
}: {
  gaps: SkillAssessment[];
  profileId: string;
  hasRoadmap: boolean;
}) {
  return (
    <>
      <PanelHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div>
          <PanelTitle>What is costing you the most</PanelTitle>
          <PanelNote>
            Ranked by job description demand multiplied by how much of the skill is still unproven.
          </PanelNote>
        </div>
        <Button asChild variant={hasRoadmap ? 'outline' : 'primary'} className="shrink-0">
          <Link href={`/roadmap/${profileId}`}>
            {hasRoadmap ? 'Open roadmap' : 'Build my roadmap'}
          </Link>
        </Button>
      </PanelHeader>

      <ol className="divide-y">
        {gaps.map((gap, index) => (
          <li key={gap.skill} className="flex items-start gap-4 px-5 py-3">
            <span className="tabular w-5 shrink-0 pt-0.5 text-ui-sm text-muted">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{gap.skill}</span>
                <EvidenceBadge level={gap.level} />
                <span className="tabular text-ui-sm text-muted">
                  in {formatPercent(gap.frequency)} of job descriptions
                </span>
              </div>
              <p className="mt-1 max-w-prose text-ui-sm text-muted">{gap.evidence_summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
