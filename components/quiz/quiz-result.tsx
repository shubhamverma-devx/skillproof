'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EvidenceBadge } from '@/components/ui/evidence-badge';
import { Panel } from '@/components/ui/panel';
import { formatPercent } from '@/lib/utils';
import type { QuizAnswerResponse } from '@/types/api';

type Result = NonNullable<QuizAnswerResponse['result']>;

export function QuizResult({
  profileId,
  skill,
  result,
}: {
  profileId: string;
  skill: string;
  result: Result;
}) {
  const router = useRouter();

  // The dashboard is a server component, so its cached copy has to be dropped
  // for the new score to be there when the student navigates back.
  useEffect(() => router.refresh(), [router]);

  return (
    <Panel>
      <div className="border-b px-5 py-5">
        <p className="text-ui-sm text-muted">Quiz result</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span className="tabular font-display text-h1 font-bold">
            {formatPercent(result.score)}
          </span>
          <EvidenceBadge level={result.verified ? 'verified' : 'claimed'} />
          <span className="text-ui-sm text-muted">on {skill}</span>
        </div>
        <p className="mt-3 max-w-prose text-ui-sm text-muted">
          {result.verified
            ? `${skill} now counts as verified evidence. Your proficiency for it is the quiz score itself, not an assumption.`
            : `That is below the bar for a verified badge, so ${skill} keeps its earlier evidence level and its proficiency is now the quiz score. That is useful: it says the gap is real.`}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="tabular text-ui">
            Readiness is now <span className="font-semibold">{result.readiness}</span> out of 100
            {result.readiness_delta !== null && result.readiness_delta !== 0 ? (
              <span
                className={result.readiness_delta > 0 ? 'text-observed-ink' : 'text-claimed-ink'}
              >
                {' '}
                ({result.readiness_delta > 0 ? '+' : ''}
                {result.readiness_delta})
              </span>
            ) : null}
          </p>
          <p className="text-ui-sm text-muted">The change is recorded in your score history.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/roadmap/${profileId}`}>Open roadmap</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/${profileId}`}>Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </Panel>
  );
}
