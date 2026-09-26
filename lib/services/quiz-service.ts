import { QUIZ, SCORING } from '@/lib/config';
import { getStore } from '@/lib/db';
import { canQuiz, generateQuestion, lastAttemptScore, nextDifficulty, QuizUnavailableError, scoreAttempt } from '@/lib/agent/quiz';
import { recomputeAndRecord } from '@/lib/agent/rescore';
import { Tracer } from '@/lib/agent/trace';
import { normaliseSkillName } from '@/lib/skills/taxonomy';
import { formatPercent } from '@/lib/utils';
import type { QuizAnswerResponse, QuizStartResponse } from '@/types/api';
import type { ClientQuizQuestion, QuizAttempt, QuizQuestion } from '@/types/domain';

function toClientQuestion(question: QuizQuestion, index: number): ClientQuizQuestion {
  return {
    question: question.question,
    options: question.options,
    difficulty: question.difficulty,
    index: index + 1,
    total: QUIZ.questionsPerSkill,
  };
}

/** Starts an attempt at the configured starting difficulty and returns question one. */
export async function startQuiz(profileId: string, rawSkill: string): Promise<QuizStartResponse> {
  const store = getStore();
  const profile = await store.getProfile(profileId);
  if (!profile) throw new Error('Profile not found');

  const skill = normaliseSkillName(rawSkill);
  if (!skill) throw new Error(`We do not track a skill called "${rawSkill}".`);
  if (!canQuiz(skill)) throw new QuizUnavailableError(skill);

  const tracer = new Tracer(profileId);
  await tracer.info('Quiz started', `${skill}, ${QUIZ.questionsPerSkill} adaptive questions`);

  const question = await generateQuestion(skill, QUIZ.startDifficulty, [], tracer, profile.is_demo);
  const attempt = await store.createQuizAttempt({
    profile_id: profileId,
    skill,
    questions: [question],
    answers: [],
    difficulty_path: [question.difficulty],
  });

  return {
    attempt_id: attempt.id,
    skill,
    question: toClientQuestion(question, 0),
    previous_score: await lastAttemptScore(profileId, skill),
  };
}

/**
 * Grades one answer and either serves the next question at the adapted
 * difficulty or closes the attempt and recalculates readiness.
 */
export async function answerQuiz(
  profileId: string,
  attemptId: string,
  answerIndex: number,
): Promise<QuizAnswerResponse> {
  const store = getStore();
  const profile = await store.getProfile(profileId);
  if (!profile) throw new Error('Profile not found');

  const attempt = await store.getQuizAttempt(attemptId);
  if (!attempt || attempt.profile_id !== profileId) throw new Error('Quiz attempt not found');
  if (attempt.score !== null) throw new Error('This attempt is already finished.');

  const position = attempt.answers.length;
  const current = attempt.questions[position];
  if (!current) throw new Error('This attempt has no question waiting for an answer.');

  const correct = answerIndex === current.correct_index;
  const answers = [...attempt.answers, answerIndex];

  if (answers.length < QUIZ.questionsPerSkill) {
    return serveNextQuestion(attempt, answers, current.difficulty, correct, profile.is_demo);
  }

  return finishAttempt(attempt, answers, correct, current);
}

async function serveNextQuestion(
  attempt: QuizAttempt,
  answers: number[],
  currentDifficulty: QuizQuestion['difficulty'],
  correct: boolean,
  isDemo: boolean,
): Promise<QuizAnswerResponse> {
  const tracer = new Tracer(attempt.profile_id);
  const difficulty = nextDifficulty(currentDifficulty, correct);
  const question = await generateQuestion(
    attempt.skill,
    difficulty,
    attempt.questions,
    tracer,
    isDemo,
  );

  await getStore().updateQuizAttempt(attempt.id, {
    questions: [...attempt.questions, question],
    answers,
    difficulty_path: [...attempt.difficulty_path, difficulty],
  });

  const asked = attempt.questions[answers.length - 1];
  return {
    correct,
    correct_index: asked?.correct_index ?? 0,
    explanation: asked?.explanation ?? '',
    next: toClientQuestion(question, answers.length),
    result: null,
  };
}

async function finishAttempt(
  attempt: QuizAttempt,
  answers: number[],
  correct: boolean,
  lastQuestion: QuizQuestion,
): Promise<QuizAnswerResponse> {
  const tracer = new Tracer(attempt.profile_id);
  const score = scoreAttempt(attempt.questions, answers);

  await getStore().updateQuizAttempt(attempt.id, { answers, score });
  await tracer.info(
    'Quiz finished',
    `${attempt.skill} scored ${formatPercent(score)} across ${attempt.difficulty_path.join(', ')} questions`,
  );

  const rescored = await recomputeAndRecord(
    attempt.profile_id,
    `Quiz on ${attempt.skill} scored ${formatPercent(score)}`,
    tracer,
  );

  return {
    correct,
    correct_index: lastQuestion.correct_index,
    explanation: lastQuestion.explanation,
    next: null,
    result: {
      score,
      readiness: rescored.score,
      readiness_delta: rescored.delta,
      verified: score >= SCORING.verifiedThreshold,
    },
  };
}
