import { QUIZ } from '@/lib/config';
import { getBankedQuestions } from '@/lib/dataset';
import { getStore } from '@/lib/db';
import { generateJson, hashText, makeCacheKey } from '@/lib/llm';
import { skillSlug } from '@/lib/skills/taxonomy';
import { quizQuestionSchema, type Difficulty, type QuizQuestion } from '@/types/domain';
import type { Tracer } from './trace';

export class QuizUnavailableError extends Error {
  constructor(skill: string) {
    super(
      `We cannot generate questions for ${skill} right now. Add an API key, or pick a skill from the built in question bank.`,
    );
    this.name = 'QuizUnavailableError';
  }
}

const SYSTEM_PROMPT = [
  'You write one multiple choice question to test a specific technical skill.',
  'Return JSON only with keys: question, options, correct_index, explanation, difficulty.',
  'options must contain exactly four plausible answers and exactly one correct answer.',
  'easy means a definition or syntax recall. medium means applying the concept.',
  'hard means reasoning about a failure mode or a tradeoff.',
  'The explanation is one or two sentences and states why the correct option is right.',
  'Never mention that you are an AI and never use emoji.',
].join(' ');

/** Correct answers move the next question up a level, wrong answers move it down. */
export function nextDifficulty(current: Difficulty, correct: boolean): Difficulty {
  if (correct) return current === 'easy' ? 'medium' : 'hard';
  return current === 'hard' ? 'medium' : 'easy';
}

/**
 * Difficulty weighted score. Four hard answers are worth more than four easy
 * ones, so an adaptive path that climbs is rewarded.
 */
export function scoreAttempt(questions: QuizQuestion[], answers: number[]): number {
  let earned = 0;
  let available = 0;

  questions.forEach((question, index) => {
    const weight = QUIZ.difficultyWeights[question.difficulty];
    available += weight;
    if (answers[index] === question.correct_index) earned += weight;
  });

  if (available === 0) return 0;
  return Math.round((earned / available) * 1000) / 1000;
}

export async function generateQuestion(
  skill: string,
  difficulty: Difficulty,
  alreadyAsked: QuizQuestion[],
  tracer: Tracer,
  isDemo: boolean,
): Promise<QuizQuestion> {
  const asked = alreadyAsked.map((question) => question.question);
  const banked = pickFromBank(skill, difficulty, asked);

  const { value, source } = await generateJson({
    schema: quizQuestionSchema,
    system: SYSTEM_PROMPT,
    user: [
      `Skill: ${skill}`,
      `Difficulty: ${difficulty}`,
      asked.length > 0
        ? `Do not repeat these questions:\n${asked.map((text) => `- ${text}`).join('\n')}`
        : 'This is the first question of the attempt.',
    ].join('\n\n'),
    cacheKey: makeCacheKey(
      isDemo,
      ['quiz', skillSlug(skill), difficulty, String(alreadyAsked.length)],
      hashText(asked.join('|')),
    ),
    logger: tracer,
    fallback: banked ? () => banked : undefined,
  }).catch((error: unknown) => {
    if (banked) return { value: banked, source: 'fallback' as const };
    throw error;
  });

  if (source === 'fallback') {
    await tracer.warn(
      'Question bank used',
      `No model answer for ${skill} at ${difficulty} level, served a stored question instead`,
    );
  }

  // The model is asked for a difficulty but is not trusted to label it; the
  // adaptive path and the score both depend on this value.
  return { ...value, difficulty };
}

export function canQuiz(skill: string): boolean {
  return getBankedQuestions(skillSlug(skill)).length > 0 || hasLlmProvider();
}

function hasLlmProvider(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY ?? process.env.GEMINI_API_KEY);
}

function pickFromBank(skill: string, difficulty: Difficulty, asked: string[]): QuizQuestion | null {
  const bank = getBankedQuestions(skillSlug(skill));
  const unused = bank.filter(
    (question) => question.difficulty === difficulty && !asked.includes(question.question),
  );
  const pool = unused.length > 0 ? unused : bank.filter((q) => !asked.includes(q.question));
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return choice ? { ...choice, difficulty } : null;
}

/** Latest completed attempt for a skill, used to show the previous result. */
export async function lastAttemptScore(profileId: string, skill: string): Promise<number | null> {
  const attempts = await getStore().listQuizAttempts(profileId);
  const completed = attempts
    .filter((attempt) => attempt.skill === skill && attempt.score !== null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return completed.at(-1)?.score ?? null;
}
