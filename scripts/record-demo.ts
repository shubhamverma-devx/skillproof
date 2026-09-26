/**
 * Drives the demo storyline in a real browser at the pace of docs/DEMO_SCRIPT.md.
 *
 *   pnpm demo:shots                      screenshots only, against localhost
 *   pnpm demo:record:video               screenshots plus a recorded video
 *   DEMO_BASE=https://... pnpm demo:record:video
 *
 * It produces the slide images in docs/screenshots/deck and, with --video, a
 * silent recording in docs/video for a voice over. Pauses match the script so
 * the narration lines up.
 */
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { loadAnswerKey, normalise } from './demo-answers';

const BASE = process.env.DEMO_BASE ?? 'http://localhost:3000';
const RECORD_VIDEO = process.argv.includes('--video');
const SHOTS = path.join(process.cwd(), 'docs', 'screenshots', 'deck');
const VIDEO = path.join(process.cwd(), 'docs', 'video');

const answerKey = loadAnswerKey();
let shotIndex = 0;

/** Long enough for a narrator to finish the matching sentence. */
const BEAT = { short: 900, read: 2200, long: 3200 } as const;

async function shot(page: Page, name: string): Promise<void> {
  shotIndex += 1;
  await page.screenshot({
    path: path.join(SHOTS, `${String(shotIndex).padStart(2, '0')}-${name}.png`),
  });
}

async function pause(page: Page, ms: number): Promise<void> {
  await page.waitForTimeout(ms);
}

const VERBOSE = process.argv.includes('--verbose');
function step(message: string): void {
  if (VERBOSE) process.stdout.write(`  . ${message}\n`);
}

/** Answers one quiz, taking the correct option from the recorded answer key. */
async function playQuiz(
  page: Page,
  skill: string,
  deliberateMistakes: number,
  quiet = false,
): Promise<void> {
  let wrongLeft = deliberateMistakes;

  for (let question = 1; question <= 4; question += 1) {
    step(`${skill} question ${question}`);
    const submit = page.getByRole('button', { name: 'Submit answer' });
    await submit.waitFor({ state: 'visible' });

    const prompt = normalise(await page.locator('[data-question]').first().innerText());
    step(`  prompt: ${prompt.slice(0, 60)}`);
    const correct = answerKey.get(prompt) ?? 0;
    const pick = wrongLeft > 0 ? (correct + 1) % 4 : correct;
    if (wrongLeft > 0) wrongLeft -= 1;

    // The options re-render between questions, so the click is confirmed rather
    // than assumed: the submit button stays disabled until one is selected.
    const option = page.locator(`#option-${pick}`);
    await option.waitFor({ state: 'visible' });
    for (let attempt = 0; attempt < 4 && (await submit.isDisabled()); attempt += 1) {
      await option.click();
      await pause(page, 300);
    }
    step(`  picked option ${pick}, submit disabled=${await submit.isDisabled()}`);
    await pause(page, BEAT.short);
    await submit.click();

    await page.waitForSelector('text=/Correct|Not quite/');
    if (question === 1 && !quiet) await shot(page, `quiz-${skill.toLowerCase()}-feedback`);
    await pause(page, quiet ? BEAT.short : BEAT.read);

    const next = page.getByRole('button', { name: /Next question|See your result/ });
    await next.click();
    await pause(page, BEAT.short);
  }

  await page.waitForSelector('text=Quiz result');
  if (!quiet) await shot(page, `quiz-${skill.toLowerCase()}-result`);
  await pause(page, quiet ? BEAT.short : BEAT.read);
}

async function run(page: Page): Promise<string> {
  // 0:00 the problem
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await pause(page, BEAT.long);
  await shot(page, 'landing');

  await page.getByRole('button', { name: 'Load demo profile' }).click();

  // 0:20 the agent works in the open
  await page.waitForURL('**/analyze/**');
  await pause(page, 1200);
  await shot(page, 'analysis');
  await page.waitForURL('**/dashboard/**', { timeout: 120_000 });
  const profileId = page.url().split('/dashboard/')[1] ?? '';

  // 0:45 the score and the evidence
  await page.waitForSelector('text=Readiness for');
  await pause(page, BEAT.long);
  await shot(page, 'dashboard');

  await page.getByRole('button', { name: /^Why SQL matters$/ }).click();
  await pause(page, BEAT.read);
  await shot(page, 'evidence-sql');
  await pause(page, BEAT.short);

  // 1:20 proving a skill
  await page.goto(`${BASE}/quiz/${profileId}?skill=Python`, { waitUntil: 'networkidle' });
  await shot(page, 'quiz-start');
  await playQuiz(page, 'Python', 0);

  await page.goto(`${BASE}/quiz/${profileId}?skill=SQL`, { waitUntil: 'networkidle' });
  await playQuiz(page, 'SQL', 3);

  // 1:45 the roadmap
  await page.goto(`${BASE}/roadmap/${profileId}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Build my roadmap' }).click();
  await page.waitForSelector('text=Approve roadmap', { timeout: 120_000 });
  await pause(page, BEAT.read);
  await shot(page, 'roadmap');

  await page
    .getByRole('button', { name: /^Details for/ })
    .first()
    .click();
  await pause(page, BEAT.long);
  await shot(page, 'roadmap-item');

  await page.getByRole('button', { name: 'Approve roadmap' }).click();
  await page.waitForSelector('text=approved', { timeout: 60_000 });
  await pause(page, BEAT.short);

  // 2:15 the replan
  await page.goto(`${BASE}/progress/${profileId}`, { waitUntil: 'networkidle' });
  await pause(page, BEAT.read);

  for (const index of [0, 1]) {
    await page
      .getByRole('button', { name: 'Mark done' })
      .nth(index === 0 ? 0 : 0)
      .click();
    await page.waitForSelector('text=What changed', { timeout: 120_000 });
    await pause(page, BEAT.short);
  }
  await shot(page, 'progress-marked-done');
  await pause(page, BEAT.long);

  await page
    .getByLabel('Repository URL or owner/name')
    .fill('riya-sharma-demo/ml-deploy-service', { timeout: 15_000 });
  await pause(page, BEAT.short);
  await page.getByRole('button', { name: 'Scan repository' }).click();
  await page.waitForSelector('text=Readiness moved', { timeout: 120_000 });
  await pause(page, BEAT.read);
  await shot(page, 'progress-replan');

  // The narration says she then proves Docker and retakes SQL, so the recording
  // has to actually do it or the closing number would be a claim, not a result.
  step('docker quiz');
  await page.goto(`${BASE}/quiz/${profileId}?skill=Docker`, { waitUntil: 'networkidle' });
  await playQuiz(page, 'Docker', 0, true);
  step('sql retake');
  await page.goto(`${BASE}/quiz/${profileId}?skill=SQL`, { waitUntil: 'networkidle' });
  await playQuiz(page, 'SQL', 0, true);

  await page.goto(`${BASE}/dashboard/${profileId}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Readiness for');
  await pause(page, BEAT.long);
  await shot(page, 'dashboard-final');
  await page.locator('text=Score history').scrollIntoViewIfNeeded();
  await pause(page, BEAT.read);
  await shot(page, 'score-history');
  await pause(page, BEAT.read);

  return profileId;
}

async function main(): Promise<void> {
  await rm(SHOTS, { recursive: true, force: true });
  await mkdir(SHOTS, { recursive: true });
  if (RECORD_VIDEO) await mkdir(VIDEO, { recursive: true });

  const browser = await chromium.launch({ slowMo: RECORD_VIDEO ? 120 : 0 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: RECORD_VIDEO ? 1 : 2,
    recordVideo: RECORD_VIDEO ? { dir: VIDEO, size: { width: 1440, height: 900 } } : undefined,
  });

  const page = await context.newPage();
  const profileId = await run(page);

  await context.close();
  await browser.close();

  if (RECORD_VIDEO) {
    const files = (await readdir(VIDEO)).filter((file) => file.endsWith('.webm'));
    const newest = files.sort().at(-1);
    if (newest) await rename(path.join(VIDEO, newest), path.join(VIDEO, 'raw-demo.webm'));
    process.stdout.write(`Video: docs/video/raw-demo.webm\n`);
  }
  process.stdout.write(
    `${shotIndex} screenshots in docs/screenshots/deck\nProfile: ${BASE}/dashboard/${profileId}\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
