import { getStore } from '@/lib/db';

/**
 * Latest completed quiz score per skill. Later attempts replace earlier ones, so
 * a retake after learning is what counts rather than a first attempt average.
 */
export async function verifiedScoresFor(profileId: string): Promise<Map<string, number>> {
  const attempts = await getStore().listQuizAttempts(profileId);
  const latest = new Map<string, { score: number; at: string }>();

  for (const attempt of attempts) {
    if (attempt.score === null) continue;
    const current = latest.get(attempt.skill);
    if (!current || attempt.created_at > current.at) {
      latest.set(attempt.skill, { score: attempt.score, at: attempt.created_at });
    }
  }

  return new Map([...latest.entries()].map(([skill, entry]) => [skill, entry.score]));
}
