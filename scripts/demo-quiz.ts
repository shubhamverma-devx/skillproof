/**
 * Plays the demo quizzes, on camera and off it, for scripts/record-demo.ts.
 *
 * Keeping this out of the recorder leaves that file about the storyline and the
 * pacing, which is the part that changes whenever the demo script changes.
 */
import type { Page } from '@playwright/test';
import { loadAnswerKey, normalise } from './demo-answers';

const answerKey = loadAnswerKey();

export type QuizContext = {
  /** Pauses the recording, so the narrator has time to finish a sentence. */
  pause: (page: Page, ms: number) => Promise<void>;
  /** Captures a numbered slide image. */
  shot: (page: Page, name: string) => Promise<void>;
  /** Prints a line when the recorder is run with --verbose. */
  step: (message: string) => void;
  /** Gap between a click and the next one, so the click reads on camera. */
  clickPause: number;
  /** Gap after feedback appears, sized to the narration over the quiz beats. */
  readPause: number;
};

/** Answers one quiz on camera, taking the correct option from the answer key. */
export async function playQuiz(
  page: Page,
  skill: string,
  deliberateMistakes: number,
  ctx: QuizContext,
): Promise<void> {
  let wrongLeft = deliberateMistakes;

  for (let question = 1; question <= 4; question += 1) {
    ctx.step(`${skill} question ${question}`);
    const submit = page.getByRole('button', { name: 'Submit answer' });
    await submit.waitFor({ state: 'visible' });

    const prompt = normalise(await page.locator('[data-question]').first().innerText());
    ctx.step(`  prompt: ${prompt.slice(0, 60)}`);
    const correct = answerKey.get(prompt) ?? 0;
    const pick = wrongLeft > 0 ? (correct + 1) % 4 : correct;
    if (wrongLeft > 0) wrongLeft -= 1;

    // The options re-render between questions, so the click is confirmed rather
    // than assumed: the submit button stays disabled until one is selected.
    const option = page.locator(`#option-${pick}`);
    await option.waitFor({ state: 'visible' });
    for (let attempt = 0; attempt < 4 && (await submit.isDisabled()); attempt += 1) {
      await option.click();
      await ctx.pause(page, 300);
    }
    ctx.step(`  picked option ${pick}, submit disabled=${await submit.isDisabled()}`);
    await ctx.pause(page, ctx.clickPause);
    await submit.click();

    await page.waitForSelector('text=/Correct|Not quite/');
    if (question === 1) await ctx.shot(page, `quiz-${skill.toLowerCase()}-feedback`);
    await ctx.pause(page, ctx.readPause);

    await page.getByRole('button', { name: /Next question|See your result/ }).click();
    await ctx.pause(page, ctx.clickPause);
  }

  await page.waitForSelector('text=Quiz result');
  await ctx.shot(page, `quiz-${skill.toLowerCase()}-result`);
  await ctx.pause(page, ctx.readPause);
}

/** Plays a quiz through the API, for the steps the narration covers off camera. */
export async function quizByApi(base: string, profileId: string, skill: string): Promise<void> {
  type Start = { attempt_id: string; question: { question: string } };
  type Answer = { next: { question: string } | null; result: unknown };

  const post = async <T>(route: string, body: unknown): Promise<T> => {
    const response = await fetch(`${base}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { data?: T; error?: string };
    if (payload.error) throw new Error(`${route}: ${payload.error}`);
    return payload.data as T;
  };

  const start = await post<Start>(`/api/quiz/${profileId}/start`, { skill });
  let question = start.question;

  for (;;) {
    const reply = await post<Answer>(`/api/quiz/${profileId}/answer`, {
      attempt_id: start.attempt_id,
      answer_index: answerKey.get(normalise(question.question)) ?? 0,
    });
    if (reply.result || !reply.next) return;
    question = reply.next;
  }
}
