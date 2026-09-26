/**
 * The correct answer for every question the demo can serve: the offline question
 * bank plus any model written question already recorded in the demo cache.
 * Shared by the storyline verifier and the demo recorder so both play the same
 * student.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

type Answerable = { question?: unknown; correct_index?: unknown };

/** Questions are markdown stripped on the way out, so both sides are normalised. */
export function normalise(question: string): string {
  return question.replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();
}

function collect(key: Map<string, number>, value: unknown): void {
  if (Array.isArray(value)) {
    for (const entry of value) collect(key, entry);
    return;
  }
  if (typeof value !== 'object' || value === null) return;

  const candidate = value as Answerable;
  if (typeof candidate.question === 'string' && typeof candidate.correct_index === 'number') {
    key.set(normalise(candidate.question), candidate.correct_index);
    return;
  }
  for (const nested of Object.values(value)) collect(key, nested);
}

export function loadAnswerKey(): Map<string, number> {
  const key = new Map<string, number>();

  const bank = path.join(process.cwd(), 'data', 'question_bank');
  for (const file of readdirSync(bank)) {
    collect(key, JSON.parse(readFileSync(path.join(bank, file), 'utf8')));
  }

  try {
    const cache = path.join(process.cwd(), 'data', 'demo', 'llm_cache.json');
    collect(key, JSON.parse(readFileSync(cache, 'utf8')));
  } catch {
    // No recorded cache yet: the bank alone still covers the offline demo.
  }

  return key;
}
