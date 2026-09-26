import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProfileState } from '@/lib/agent/profile-state';
import { DemoNotice } from '@/components/layout/demo-notice';
import { PageShell } from '@/components/layout/page-shell';
import { ProfileNav } from '@/components/layout/profile-nav';
import { SiteHeader } from '@/components/layout/site-header';
import { RoadmapView } from '@/components/roadmap/roadmap-view';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Roadmap | SkillProof' };

export default async function RoadmapPage({ params }: { params: { id: string } }) {
  const state = await loadProfileState(params.id);
  if (!state) notFound();

  return (
    <>
      <SiteHeader>
        <ProfileNav profileId={state.profile.id} active="roadmap" />
      </SiteHeader>
      <PageShell>
        <div className="mb-6">
          <h1 className="text-h2">Your roadmap</h1>
          <p className="mt-1 max-w-prose text-ui-sm text-muted">
            Ordered by what costs you the most readiness, with prerequisites first. Every item says
            why it is there and ends in something you can show.
          </p>
        </div>
        {state.demo ? <DemoNotice className="mb-4" /> : null}
        <RoadmapView state={state} />
      </PageShell>
    </>
  );
}
