import { AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProfileState } from '@/lib/agent/profile-state';
import { FirstVisitTour } from '@/components/dashboard/first-visit-tour';
import { HowWeWorkedItOut } from '@/components/dashboard/how-we-worked-it-out';
import { NextStepCard } from '@/components/dashboard/next-step-card';
import { ProofStats } from '@/components/dashboard/proof-stats';
import { ScoreCard } from '@/components/dashboard/score-card';
import { ScoreHistoryChart } from '@/components/dashboard/score-history-chart';
import { TopGaps } from '@/components/dashboard/top-gaps';
import { AppShell } from '@/components/layout/app-shell';
import { Panel, PanelHeader, PanelNote, PanelTitle } from '@/components/ui/panel';
import { nextStep } from '@/lib/next-step';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Overview | SkillProof' };

export default async function OverviewPage({ params }: { params: { id: string } }) {
  const state = await loadProfileState(params.id);
  if (!state) notFound();

  const previousScore = state.history.at(-2)?.score ?? null;
  const githubMissing = state.github.username !== null && !state.github.available;
  const githubOnly =
    state.evidence_mix.observed > 0 &&
    state.evidence_mix.claimed === 0 &&
    state.evidence_mix.tested === 0;

  return (
    <AppShell
      profileId={state.profile.id}
      active="overview"
      studentName={state.profile.name}
      roleName={state.role.name}
      isDemo={state.demo}
      title="Overview"
      subtitle={`Where you stand for ${state.role.name} work, and the one thing worth doing next.`}
    >
      <div className="flex flex-col gap-4">
        {githubMissing ? (
          <p className="flex items-start gap-2.5 rounded-panel border border-claimed/30 bg-claimed-soft/[0.07] px-4 py-3 text-sm">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-claimed" aria-hidden="true" />
            <span className="max-w-prose">
              We could not read {state.github.username}&apos;s projects, so this is based on your
              resume alone. Check the username on the Progress page.
            </span>
          </p>
        ) : null}

        <FirstVisitTour />

        <ScoreCard
          score={state.score}
          ceiling={state.ceiling}
          previousScore={previousScore}
          roleName={state.role.name}
          assessments={state.assessments}
          githubOnly={githubOnly}
        />

        <NextStepCard step={nextStep(state)} />

        <ProofStats assessments={state.assessments} profileId={state.profile.id} />

        <TopGaps gaps={state.gaps} profileId={state.profile.id} />

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Your score over time</PanelTitle>
                <PanelNote>Every change, and what caused it.</PanelNote>
              </div>
            </PanelHeader>
            <ScoreHistoryChart history={state.history} />
          </Panel>

          <HowWeWorkedItOut logs={state.logs} />
        </div>

        <p className="max-w-prose text-xs text-ink-faint">{state.role.source_note}</p>
      </div>
    </AppShell>
  );
}
