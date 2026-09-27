import { shortDemand } from '@/lib/wording';
import type { ProfileState } from '@/types/api';

export type NextStep = {
  title: string;
  body: string;
  action: string;
  href: string;
  /** Roughly how long it takes, so the ask feels small. */
  effort: string;
};

/**
 * The one thing this student should do next, chosen from their current state.
 * The Overview page shows exactly one primary button, and this decides what it
 * says, so a student never has to work out where to start.
 */
export function nextStep(state: ProfileState): NextStep {
  const id = state.profile.id;
  const roadmap = state.roadmap;

  if (!roadmap || roadmap.items.length === 0) {
    return {
      title: 'Build your plan',
      body: `We know what is missing for ${state.role.name} work. Turn it into a week by week plan that fits ${state.profile.weekly_hours} hours a week.`,
      action: 'Build my plan',
      href: `/roadmap/${id}`,
      effort: 'About 30 seconds',
    };
  }

  if (roadmap.roadmap.status === 'draft') {
    return {
      title: 'Check your plan and approve it',
      body: 'Nothing is fixed until you say so. Reorder it, change the hours, or skip anything that does not fit.',
      action: 'Review my plan',
      href: `/roadmap/${id}`,
      effort: 'About 2 minutes',
    };
  }

  // Something the student can prove right now with four questions.
  const testable = state.assessments.find(
    (skill) => skill.frequency >= 0.5 && !skill.tested && (skill.claimed || skill.observed),
  );
  if (testable) {
    return {
      title: `Prove you know ${testable.skill}`,
      body: `${testable.skill} is asked for in ${shortDemand(testable.frequency)}. Four questions is enough to turn it from a claim into something tested.`,
      action: `Take the ${testable.skill} test`,
      href: `/quiz/${id}?skill=${encodeURIComponent(testable.skill)}`,
      effort: 'About 2 minutes',
    };
  }

  const biggestGap = state.gaps.find((gap) => !gap.observed);
  if (biggestGap) {
    return {
      title: `Show us something that uses ${biggestGap.skill}`,
      body: `${biggestGap.skill} is asked for in ${shortDemand(biggestGap.frequency)} and we could not find it in your code. Link a repository that uses it.`,
      action: 'Link a project',
      href: `/progress/${id}`,
      effort: 'About 1 minute',
    };
  }

  return {
    title: 'Record what you have finished',
    body: 'Mark off what you have done and link the projects you built. Your score moves when the proof arrives.',
    action: 'Log progress',
    href: `/progress/${id}`,
    effort: 'About 1 minute',
  };
}
