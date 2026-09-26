'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PanelHeader, PanelNote, PanelTitle } from '@/components/ui/panel';
import type { SkillAssessment } from '@/lib/scoring';
import { SkillRow } from './skill-row';

type Filter = 'role' | 'gaps' | 'extra';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'role', label: 'Role skills' },
  { id: 'gaps', label: 'Gaps only' },
  { id: 'extra', label: 'Extra skills you have' },
];

export function SkillsTable({
  assessments,
  profileId,
  jdCount,
}: {
  assessments: SkillAssessment[];
  profileId: string;
  jdCount: number;
}) {
  const [filter, setFilter] = useState<Filter>('role');

  const rows = assessments.filter((assessment) => {
    if (filter === 'extra') return assessment.frequency === 0;
    if (filter === 'gaps') return assessment.frequency > 0 && assessment.proficiency < 0.6;
    return assessment.frequency > 0;
  });

  return (
    <>
      <PanelHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div>
          <PanelTitle>Skills and evidence</PanelTitle>
          <PanelNote>
            Demand is measured across {jdCount} job descriptions. Proficiency comes from the
            evidence we could find.
          </PanelNote>
        </div>
        <div className="-mx-1 flex shrink-0 gap-1 overflow-x-auto rounded-inner bg-bg p-1">
          {FILTERS.map((option) => (
            <Button
              key={option.id}
              variant={filter === option.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </PanelHeader>

      <div className="hidden items-center gap-4 border-b px-5 py-2 text-ui-sm text-muted sm:flex">
        <span className="basis-44">Skill</span>
        <span className="w-[8.25rem]">Job description demand</span>
        <span className="w-[8.25rem]">Your proficiency</span>
        <span className="w-28">Evidence</span>
        <span className="ml-auto w-[11.75rem]">Action</span>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-6 text-ui-sm text-muted">
          Nothing to show here. Switch the filter to see your role skills.
        </p>
      ) : (
        <div className="divide-y">
          {rows.map((assessment) => (
            <SkillRow key={assessment.skill} assessment={assessment} profileId={profileId} />
          ))}
        </div>
      )}
    </>
  );
}
