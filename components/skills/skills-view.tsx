'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import { PROOF_LABEL, PROOF_ORDER } from '@/lib/wording';
import type { SkillAssessment } from '@/lib/scoring';
import type { EvidenceLevel } from '@/types/domain';
import { SkillRow } from './skill-row';
import { SkillSheet } from './skill-sheet';

type Filter = EvidenceLevel | 'all';

const GROUP_NOTE: Record<EvidenceLevel, string> = {
  verified: 'You answered questions on these and got them right.',
  observed: 'We found these in your public code.',
  claimed: 'Your resume lists these, but nothing else backs them up yet.',
  missing: 'Nothing we can see mentions these.',
};

export function SkillsView({
  assessments,
  profileId,
  initialFilter,
}: {
  assessments: SkillAssessment[];
  profileId: string;
  initialFilter: Filter;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<SkillAssessment | null>(null);

  const roleSkills = useMemo(
    () => assessments.filter((assessment) => assessment.frequency > 0),
    [assessments],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return roleSkills.filter((skill) => {
      if (filter !== 'all' && skill.level !== filter) return false;
      return needle.length === 0 || skill.skill.toLowerCase().includes(needle);
    });
  }, [roleSkills, filter, query]);

  const counts = useMemo(() => {
    const table = { all: roleSkills.length } as Record<Filter, number>;
    for (const level of PROOF_ORDER) {
      table[level] = roleSkills.filter((skill) => skill.level === level).length;
    }
    return table;
  }, [roleSkills]);

  const extras = assessments.filter(
    (assessment) => assessment.frequency === 0 && assessment.observed,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search skills"
            aria-label="Search skills"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1 rounded-control border bg-surface p-1">
          {(['all', ...PROOF_ORDER] as Filter[]).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={filter === option ? 'primary' : 'ghost'}
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
            >
              {option === 'all' ? 'All' : PROOF_LABEL[option]}
              <span className="tabular text-xs">{counts[option]}</span>
            </Button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <Panel>
          <EmptyState
            title="Nothing matches"
            body="Try a different filter, or clear the search box to see every skill this role asks for."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setFilter('all');
                  setQuery('');
                }}
              >
                Show all skills
              </Button>
            }
          />
        </Panel>
      ) : (
        PROOF_ORDER.map((level) => {
          const group = visible.filter((skill) => skill.level === level);
          if (group.length === 0) return null;
          return (
            <Panel key={level}>
              <div className="px-4 py-3.5 sm:px-5">
                <h2 className="text-base font-medium">
                  {PROOF_LABEL[level]}
                  <span className="tabular ml-2 text-sm font-normal text-ink-faint">
                    {group.length}
                  </span>
                </h2>
                <p className="mt-0.5 text-sm text-ink-muted">{GROUP_NOTE[level]}</p>
              </div>
              <div className="divide-y border-t">
                {group.map((skill) => (
                  <SkillRow key={skill.skill} skill={skill} onOpen={setOpen} />
                ))}
              </div>
            </Panel>
          );
        })
      )}

      {extras.length > 0 ? (
        <Panel className="px-4 py-4 sm:px-5">
          <h2 className="text-base font-medium">Other things we found</h2>
          <p className="mt-0.5 max-w-prose text-sm text-ink-muted">
            These showed up in your code but this role does not ask for them, so they do not change
            your score: {extras.map((skill) => skill.skill).join(', ')}.
          </p>
        </Panel>
      ) : null}

      <SkillSheet
        skill={open}
        profileId={profileId}
        onOpenChange={(next) => {
          if (!next) setOpen(null);
        }}
      />

      <p className="text-xs text-ink-faint">
        Open any skill to see the exact repository and file behind it.
      </p>
    </div>
  );
}
