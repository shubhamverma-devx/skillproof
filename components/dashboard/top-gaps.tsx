import Link from 'next/link';
import { Panel, PanelHeader, PanelNote, PanelTitle } from '@/components/ui/panel';
import { ProofBadge } from '@/components/ui/proof-badge';
import { Button } from '@/components/ui/button';
import { demandPhrase } from '@/lib/wording';
import type { SkillAssessment } from '@/lib/scoring';

/** The three things costing this student the most, each with one line of why. */
export function TopGaps({ gaps, profileId }: { gaps: SkillAssessment[]; profileId: string }) {
  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>What is holding you back</PanelTitle>
          <PanelNote>The three skills where the gap costs you the most.</PanelNote>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href={`/skills/${profileId}`}>See all skills</Link>
        </Button>
      </PanelHeader>

      <ol className="border-t">
        {gaps.slice(0, 3).map((gap) => (
          <li
            key={gap.skill}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-5 py-3.5 last:border-b-0"
          >
            <span className="font-medium">{gap.skill}</span>
            <ProofBadge level={gap.level} />
            <span className="tabular ml-auto text-sm text-ink-faint">
              {demandPhrase(gap.frequency)}
            </span>
            <p className="basis-full text-sm text-ink-muted">{plainReason(gap)}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/** The evidence summary rewritten as one sentence a student would say. */
function plainReason(gap: SkillAssessment): string {
  if (gap.level === 'missing') {
    return `Nothing on your resume or in your code mentions ${gap.skill}.`;
  }
  if (gap.level === 'claimed') {
    return `Your resume lists ${gap.skill}, but we could not find it in any of your projects.`;
  }
  if (gap.level === 'observed') {
    const source = gap.observed_sources[0];
    return source
      ? `We found ${gap.skill} in ${source.file}, but you have not been tested on it.`
      : `We found ${gap.skill} in your code, but you have not been tested on it.`;
  }
  return `You scored ${Math.round((gap.verified_score ?? 0) * 100)}% when tested on ${gap.skill}.`;
}
