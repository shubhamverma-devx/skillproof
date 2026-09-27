import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProfileState } from '@/lib/agent/profile-state';
import { AppShell } from '@/components/layout/app-shell';
import { SkillsView } from '@/components/skills/skills-view';
import type { EvidenceLevel } from '@/types/domain';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Skills | SkillProof' };

const FILTERS = new Set<string>(['verified', 'observed', 'claimed', 'missing']);

export default async function SkillsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { show?: string };
}) {
  const state = await loadProfileState(params.id);
  if (!state) notFound();

  const show = searchParams.show;
  const initialFilter = show && FILTERS.has(show) ? (show as EvidenceLevel) : 'all';

  return (
    <AppShell
      profileId={state.profile.id}
      active="skills"
      studentName={state.profile.name}
      roleName={state.role.name}
      isDemo={state.demo}
      title="Skills"
      subtitle={`Every skill ${state.role.name} jobs ask for, grouped by how well you can prove it.`}
    >
      <SkillsView
        assessments={state.assessments}
        profileId={state.profile.id}
        initialFilter={initialFilter}
      />
    </AppShell>
  );
}
