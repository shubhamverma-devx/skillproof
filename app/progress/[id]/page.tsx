import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProfileState } from '@/lib/agent/profile-state';
import { AppShell } from '@/components/layout/app-shell';
import { ProgressPanel } from '@/components/progress/progress-panel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Progress | SkillProof' };

export default async function ProgressPage({ params }: { params: { id: string } }) {
  const state = await loadProfileState(params.id);
  if (!state) notFound();

  return (
    <AppShell
      profileId={state.profile.id}
      active="progress"
      studentName={state.profile.name}
      roleName={state.role.name}
      isDemo={state.demo}
      title="Progress"
      subtitle={`You are at ${Math.round(state.score)}%. Anything you record here recalculates that and rebuilds the weeks you have not finished.`}
    >
      <ProgressPanel state={state} />
    </AppShell>
  );
}
