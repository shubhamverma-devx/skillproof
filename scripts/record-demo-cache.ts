/**
 * Records real model responses for the demo profile into data/demo/llm_cache.json.
 *
 *   pnpm demo:record          needs provider keys in .env.local
 *
 * The quiz is adaptive, so a single play through only records the one path it
 * happened to take. This walks every path a student can reach in four questions,
 * so the offline demo never falls through to the question bank no matter how the
 * questions are answered.
 */
import { config } from 'dotenv';
import { QUIZ } from '../lib/config';
import { generateQuestion, nextDifficulty } from '../lib/agent/quiz';
import { Tracer } from '../lib/agent/trace';
import type { Difficulty, QuizQuestion } from '../types/domain';

config({ path: '.env.local' });
process.env.DEMO_MODE = 'true';

/** Skills the demo storyline verifies. */
const SKILLS = ['Python', 'SQL', 'Docker'];

/** Correct, wrong, then everything in between. */
const PATHS: boolean[][] = [
  [true, true, true],
  [false, true, true],
  [false, false, false],
  [true, false, true],
];

async function recordPath(skill: string, answers: boolean[]): Promise<number> {
  const tracer = new Tracer('demo-recording');
  const asked: QuizQuestion[] = [];
  let difficulty: Difficulty = QUIZ.startDifficulty;
  let calls = 0;

  for (let index = 0; index < QUIZ.questionsPerSkill; index += 1) {
    const question = await generateQuestion(skill, difficulty, asked, tracer, true);
    asked.push(question);
    calls += 1;

    const correct = answers[index];
    if (correct === undefined) break;
    difficulty = nextDifficulty(difficulty, correct);
  }

  return calls;
}

async function main(): Promise<void> {
  let total = 0;
  for (const skill of SKILLS) {
    for (const path of PATHS) {
      total += await recordPath(skill, path);
    }
    process.stdout.write(`${skill}: paths recorded\n`);
  }
  process.stdout.write(
    `\n${total} question calls made. Cached entries are keyed by skill, difficulty and position, so repeats were served from the cache rather than the model.\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
