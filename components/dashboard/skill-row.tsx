'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EvidenceBadge } from '@/components/ui/evidence-badge';
import { ProofSeal } from '@/components/ui/proof-seal';
import type { SkillAssessment } from '@/lib/scoring';
import { cn, formatPercent } from '@/lib/utils';

const BAR_CLASS: Record<string, string> = {
  verified: 'bg-verified',
  observed: 'bg-observed',
  claimed: 'bg-claimed',
  missing: 'bg-missing',
};

function Meter({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
      <span className="text-ui-sm text-muted sm:hidden">{label}</span>
      <div className="h-1.5 min-w-8 flex-1 rounded-full bg-ink/[0.08] sm:w-24 sm:flex-none">
        <div className={cn('h-full rounded-full', className)} style={{ width: `${value * 100}%` }} />
      </div>
      <span className="tabular w-9 shrink-0 text-right text-ui-sm text-muted">
        {formatPercent(value)}
      </span>
    </div>
  );
}

export function SkillRow({
  assessment,
  profileId,
}: {
  assessment: SkillAssessment;
  profileId: string;
}) {
  const [open, setOpen] = useState(false);
  const sources = assessment.observed_sources;
  const detailId = `skill-detail-${assessment.skill.replace(/\W+/g, '-')}`;
  const action =
    assessment.level === 'missing'
      ? 'I already know this'
      : assessment.tested
        ? 'Retake quiz'
        : `Verify ${assessment.skill}`;

  return (
    <div className="px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:basis-44">
          <span className="truncate font-medium">{assessment.skill}</span>
          {assessment.level === 'verified' ? (
            <ProofSeal size={15} className="shrink-0 text-verified" />
          ) : null}
        </div>

        <div className="shrink-0 sm:order-3 sm:w-28">
          <EvidenceBadge level={assessment.level} />
        </div>

        <div className="flex w-full items-center gap-4 sm:order-2 sm:w-auto sm:contents">
          <Meter label="Demand" value={assessment.frequency} className="bg-ink/25" />
          <Meter
            label="You"
            value={assessment.proficiency}
            className={BAR_CLASS[assessment.level] ?? 'bg-missing'}
          />
        </div>

        <div className="ml-auto flex w-full shrink-0 items-center gap-1 sm:order-4 sm:w-auto">
          <Button asChild variant="outline" size="sm" className="w-full justify-center sm:w-40">
            <Link
              href={`/quiz/${profileId}?skill=${encodeURIComponent(assessment.skill)}`}
              title={action}
            >
              <span className="truncate">{action}</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronDown
              size={16}
              className={cn('transition-transform', open && 'rotate-180')}
              aria-hidden="true"
            />
            <span className="sr-only">
              {open ? `Hide details for ${assessment.skill}` : `Why ${assessment.skill} matters`}
            </span>
          </Button>
        </div>
      </div>

      {open ? (
        <div id={detailId} className="mt-3 rounded-inner bg-bg px-4 py-3">
          <p className="max-w-prose text-ui-sm">{assessment.evidence_summary}</p>
          {sources.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {sources.slice(0, 6).map((source, index) => (
                <li key={`${source.repo}-${source.file}-${index}`} className="text-ui-sm text-muted">
                  <span className="font-medium text-ink">{source.repo}</span>
                  {': '}
                  {source.hint}
                </li>
              ))}
            </ul>
          ) : null}
          {sources.length > 6 ? (
            <p className="mt-1 text-ui-sm text-muted">
              and {sources.length - 6} more files across your repositories
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
