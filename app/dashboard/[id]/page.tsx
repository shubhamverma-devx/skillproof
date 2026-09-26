import { AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProfileState } from '@/lib/agent/profile-state';
import { topGaps } from '@/lib/agent/computeGaps';
import { AgentTrace } from '@/components/dashboard/agent-trace';
import { CategoryRadar } from '@/components/dashboard/category-radar';
import { ProofMeter } from '@/components/dashboard/proof-meter';
import { ScoreHistoryChart } from '@/components/dashboard/score-history-chart';
import { SkillsTable } from '@/components/dashboard/skills-table';
import { TopGaps } from '@/components/dashboard/top-gaps';
import { DemoNotice } from '@/components/layout/demo-notice';
import { PageShell } from '@/components/layout/page-shell';
import { ProfileNav } from '@/components/layout/profile-nav';
import { SiteHeader } from '@/components/layout/site-header';
import { Panel, PanelHeader, PanelNote, PanelTitle } from '@/components/ui/panel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Dashboard | SkillProof' };

export default async function DashboardPage({ params }: { params: { id: string } }) {
  const state = await loadProfileState(params.id);
  if (!state) notFound();

  const previousScore = state.history.at(-2)?.score ?? null;
  const githubMissing = state.github.username !== null && !state.github.available;

  return (
    <>
      <SiteHeader>
        <ProfileNav profileId={state.profile.id} active="dashboard" />
      </SiteHeader>

      <PageShell>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-h2">{state.profile.name}</h1>
            <p className="mt-1 text-ui-sm text-muted">
              Target role {state.role.name}. {state.profile.weekly_hours} hours a week available.
              {state.github.available
                ? ` ${state.github.scanned_repos} repositories scanned.`
                : ' No GitHub evidence.'}
            </p>
          </div>
        </div>

        {state.demo ? <DemoNotice className="mb-4" /> : null}

        {githubMissing ? (
          <div className="mb-4 flex items-start gap-2 rounded-panel border border-claimed/35 bg-claimed/[0.08] px-4 py-3 text-ui-sm">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-claimed-ink"
              aria-hidden="true"
            />
            <p className="max-w-prose">
              We could not read {state.github.username}&apos;s repositories, so this score uses your
              resume only. Check the username on the progress page, or add a GitHub token and run the
              analysis again.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="flex flex-col gap-4">
            <Panel>
              <ProofMeter
                score={state.score}
                previousScore={previousScore}
                assessments={state.assessments}
                roleName={state.role.name}
              />
            </Panel>

            <Panel>
              <TopGaps
                gaps={topGaps(state.gaps)}
                profileId={state.profile.id}
                hasRoadmap={state.roadmap !== null}
              />
            </Panel>

            <Panel>
              <SkillsTable
                assessments={state.assessments}
                profileId={state.profile.id}
                jdCount={state.role.jd_count}
              />
            </Panel>
          </div>

          <div className="flex flex-col gap-4">
            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Demand against proof</PanelTitle>
                  <PanelNote>By skill category, weighted by job description demand.</PanelNote>
                </div>
              </PanelHeader>
              <CategoryRadar assessments={state.assessments} />
            </Panel>

            <Panel>
              <PanelHeader>
                <div>
                  <PanelTitle>Score history</PanelTitle>
                  <PanelNote>Every recalculation, with the reason behind it.</PanelNote>
                </div>
              </PanelHeader>
              <ScoreHistoryChart history={state.history} />
            </Panel>

            <Panel>
              <AgentTrace logs={state.logs} />
            </Panel>
          </div>
        </div>

        <p className="mt-6 max-w-prose text-ui-sm text-muted">{state.role.source_note}</p>
      </PageShell>
    </>
  );
}
