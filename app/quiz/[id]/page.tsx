import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProfileState } from '@/lib/agent/profile-state';
import { AppShell } from '@/components/layout/app-shell';
import { QuizRunner } from '@/components/quiz/quiz-runner';
import { QUIZ } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Test | SkillProof' };

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
    <AppShell
      profileId={state.profile.id}
      active="skills"
      studentName={state.profile.name}
      roleName={state.role.name}
      isDemo={state.demo}
      title={`Test: ${skill}`}
      subtitle={`${QUIZ.questionsPerSkill} questions, about two minutes. Get one right and the next is harder. Your score replaces our guess at how well you know ${skill}.`}
    >
      <div className="max-w-2xl">
        <QuizRunner profileId={state.profile.id} skill={skill} />
      </div>
    </AppShell>
  );
}
