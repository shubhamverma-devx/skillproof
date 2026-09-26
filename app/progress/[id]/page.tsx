import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProfileState } from '@/lib/agent/profile-state';
import { DemoNotice } from '@/components/layout/demo-notice';
import { PageShell } from '@/components/layout/page-shell';
import { ProfileNav } from '@/components/layout/profile-nav';
import { SiteHeader } from '@/components/layout/site-header';
import { ProgressPanel } from '@/components/progress/progress-panel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Log progress | SkillProof' };

export default async function ProgressPage({ params }: { params: { id: string } }) {
  const state = await loadProfileState(params.id);
  if (!state) notFound();

  return (
    <>
      <SiteHeader>
        <ProfileNav profileId={state.profile.id} active="progress" />
      </SiteHeader>
      <PageShell>
        <div className="mb-6">
          <h1 className="text-h2">Log progress</h1>
          <p className="mt-1 max-w-prose text-ui-sm text-muted">
            Readiness is {state.score} out of 100 right now. Anything you record here recalculates
            it and replans the weeks you have not finished.
          </p>
        </div>
        {state.demo ? <DemoNotice className="mb-4" /> : null}
        <ProgressPanel state={state} />
      </PageShell>
    </>
  );
}
