import { describe, expect, it } from 'vitest';
import { QUIZ } from '@/lib/config';
import { nextDifficulty, scoreAttempt } from '@/lib/agent/quiz';
import type { Difficulty, QuizQuestion } from '@/types/domain';

function question(difficulty: Difficulty): QuizQuestion {
  return {
    question: `A ${difficulty} question`,
    options: ['a', 'b', 'c', 'd'],
    correct_index: 0,
    explanation: 'because',
    difficulty,
  };
}

/** Replays the adaptive path the quiz service follows for a run of answers. */
function walk(results: boolean[]): Difficulty[] {
  let current: Difficulty = QUIZ.startDifficulty;
  const path: Difficulty[] = [current];
  for (const correct of results.slice(0, -1)) {
    current = nextDifficulty(current, correct);
    path.push(current);
  }
  return path;
}

describe('nextDifficulty', () => {
  it('climbs on a correct answer and stops at hard', () => {
    expect(nextDifficulty('easy', true)).toBe('medium');
    expect(nextDifficulty('medium', true)).toBe('hard');
    expect(nextDifficulty('hard', true)).toBe('hard');
  });

  it('drops on a wrong answer and stops at easy', () => {
    expect(nextDifficulty('hard', false)).toBe('medium');
    expect(nextDifficulty('medium', false)).toBe('easy');
    expect(nextDifficulty('easy', false)).toBe('easy');
  });
});

describe('adaptive path', () => {
  it('reaches hard questions for a student who keeps answering correctly', () => {
    expect(walk([true, true, true, true])).toEqual(['medium', 'hard', 'hard', 'hard']);
  });

  it('drops to easy questions for a student who keeps answering wrong', () => {
    expect(walk([false, false, false, false])).toEqual(['medium', 'easy', 'easy', 'easy']);
  });

  it('recovers after a wrong answer', () => {
    expect(walk([false, true, true, false])).toEqual(['medium', 'easy', 'medium', 'hard']);
  });
});

describe('scoreAttempt', () => {
  it('weights hard questions above easy ones', () => {
    const questions = [question('easy'), question('hard')];
    const easyOnly = scoreAttempt(questions, [0, 1]);
    const hardOnly = scoreAttempt(questions, [1, 0]);
    expect(hardOnly).toBeGreaterThan(easyOnly);
    expect(easyOnly).toBeCloseTo(0.6 / 2.0, 3);
    expect(hardOnly).toBeCloseTo(1.4 / 2.0, 3);
  });

  it('scores a perfect and an empty attempt at the extremes', () => {
    const questions = [question('medium'), question('hard')];
    expect(scoreAttempt(questions, [0, 0])).toBe(1);
    expect(scoreAttempt(questions, [3, 3])).toBe(0);
  });

  it('treats a missing answer as wrong rather than throwing', () => {
    expect(scoreAttempt([question('medium'), question('hard')], [0])).toBeCloseTo(1 / 2.4, 3);
  });

  it('returns zero when there are no questions', () => {
    expect(scoreAttempt([], [])).toBe(0);
  });
});
