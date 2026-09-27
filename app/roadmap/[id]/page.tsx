import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProfileState } from '@/lib/agent/profile-state';
import { AppShell } from '@/components/layout/app-shell';
import { RoadmapView } from '@/components/roadmap/roadmap-view';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Roadmap | SkillProof' };

export default async function RoadmapPage({ params }: { params: { id: string } }) {
  const state = await loadProfileState(params.id);
  if (!state) notFound();

  return (
    <AppShell
      profileId={state.profile.id}
      active="roadmap"
      studentName={state.profile.name}
      roleName={state.role.name}
      isDemo={state.demo}
      title="Roadmap"
      subtitle={`What to learn, in order, at ${state.profile.weekly_hours} hours a week. Each task ends in something you can show.`}
    >
      <RoadmapView state={state} />
    </AppShell>
  );
}
