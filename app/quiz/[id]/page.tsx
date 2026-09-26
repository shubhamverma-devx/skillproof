import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProfileState } from '@/lib/agent/profile-state';
import { PageShell } from '@/components/layout/page-shell';
import { ProfileNav } from '@/components/layout/profile-nav';
import { SiteHeader } from '@/components/layout/site-header';
import { QuizRunner } from '@/components/quiz/quiz-runner';
import { QUIZ } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Verify a skill | SkillProof' };

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { skill?: string };
}) {
  const state = await loadProfileState(params.id);
  if (!state) notFound();

  const skill = searchParams.skill ?? state.quiz_candidates[0] ?? state.assessments[0]?.skill;
  if (!skill) notFound();

  return (
    <>
      <SiteHeader>
        <ProfileNav profileId={state.profile.id} active="dashboard" />
      </SiteHeader>
      <PageShell>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-h2">Verify {skill}</h1>
          <p className="mt-1 max-w-prose text-ui-sm text-muted">
            {QUIZ.questionsPerSkill} questions. Each one adapts: answer correctly and the next is
            harder, answer wrong and the next is easier. Your score replaces the assumed proficiency
            for this skill.
          </p>
          <div className="mt-6">
            <QuizRunner profileId={state.profile.id} skill={skill} />
          </div>
        </div>
      </PageShell>
    </>
  );
}
