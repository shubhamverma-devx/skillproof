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
import { mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { loadAnswerKey, normalise } from './demo-answers';

const BASE = process.env.DEMO_BASE ?? 'http://localhost:3000';
const RECORD_VIDEO = process.argv.includes('--video');
const SHOTS = path.join(process.cwd(), 'docs', 'screenshots', 'deck');
const VIDEO = path.join(process.cwd(), 'docs', 'video');

const answerKey = loadAnswerKey();
let shotIndex = 0;

/** Wall clock offsets for each narration beat, written next to the video. */
const marks: Array<{ at: number; phase: string }> = [];
let startedAt = 0;

function mark(phase: string): void {
  marks.push({ at: Math.round((Date.now() - startedAt) / 100) / 10, phase });
}

/** Long enough for a narrator to finish the matching sentence. */
const BEAT = { short: 500, read: 1500, long: 2200, hold: 5500 } as const;

/**
 * The opening and the dashboard carry the densest narration, so they get a
 * little more room than the beat scale alone would give them.
 */
const EXTRA_DWELL = 2000;

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
async function playQuiz(page: Page, skill: string, deliberateMistakes: number): Promise<void> {
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
    if (question === 1) await shot(page, `quiz-${skill.toLowerCase()}-feedback`);
    await pause(page, BEAT.read);

    const next = page.getByRole('button', { name: /Next question|See your result/ });
    await next.click();
    await pause(page, BEAT.short);
  }

  await page.waitForSelector('text=Quiz result');
  await shot(page, `quiz-${skill.toLowerCase()}-result`);
  await pause(page, BEAT.read);
}

/** Plays a quiz through the API, for the steps the narration covers off camera. */
async function quizByApi(profileId: string, skill: string): Promise<void> {
  type Start = { attempt_id: string; question: { question: string } };
  type Answer = { next: { question: string } | null; result: unknown };

  const post = async <T>(route: string, body: unknown): Promise<T> => {
    const response = await fetch(`${BASE}${route}`, {
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

async function run(page: Page): Promise<string> {
  startedAt = Date.now();
  mark('The problem, on the landing page');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await pause(page, BEAT.hold + EXTRA_DWELL);
  await shot(page, 'landing');

  await page.getByRole('button', { name: 'Load demo profile' }).click();

  mark('The agent works in the open');
  await page.waitForURL('**/analyze/**');
  await pause(page, 1200);
  await shot(page, 'analysis');
  await page.waitForURL('**/dashboard/**', { timeout: 120_000 });
  const profileId = page.url().split('/dashboard/')[1] ?? '';

  mark('The score and the Proof Meter');
  await page.waitForSelector('text=Readiness for');
  await pause(page, BEAT.hold);
  await shot(page, 'dashboard');

  // The narration explains what the meter means and reads the evidence ceiling
  // here, so the recording dwells and shows a proven segment against an empty
  // one rather than sitting still.
  const segments = page.locator('[role="img"] button');
  await segments.first().hover();
  await pause(page, BEAT.read);
  await segments.nth(Math.max(0, (await segments.count()) - 4)).hover();
  await pause(page, BEAT.read);
  await pause(page, BEAT.hold + EXTRA_DWELL);

  mark('Expanding the SQL evidence');
  await page.getByRole('button', { name: /^Why SQL matters$/ }).click();
  await pause(page, BEAT.read);
  await shot(page, 'evidence-sql');
  await pause(page, BEAT.long);

  mark('Verifying Python');
  await page.goto(`${BASE}/quiz/${profileId}?skill=Python`, { waitUntil: 'networkidle' });
  await shot(page, 'quiz-start');
  await playQuiz(page, 'Python', 0);

  mark('Verifying SQL, the claimed but weak skill');
  await page.goto(`${BASE}/quiz/${profileId}?skill=SQL`, { waitUntil: 'networkidle' });
  await playQuiz(page, 'SQL', 3);

  mark('Building the roadmap');
  await page.goto(`${BASE}/roadmap/${profileId}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Build my roadmap' }).click();
  await page.waitForSelector('text=Approve roadmap', { timeout: 120_000 });
  await pause(page, BEAT.read);
  await shot(page, 'roadmap');

  mark('Opening a roadmap item and its proof project');
  await page
    .getByRole('button', { name: /^Details for/ })
    .first()
    .click();
  await pause(page, BEAT.hold);
  await shot(page, 'roadmap-item');

  mark('Approving the roadmap');
  await page.getByRole('button', { name: 'Approve roadmap' }).click();
  await page.waitForSelector('text=approved', { timeout: 60_000 });
  await pause(page, BEAT.short);

  mark('Logging progress');
  await page.goto(`${BASE}/progress/${profileId}`, { waitUntil: 'networkidle' });
  await pause(page, BEAT.read);

  mark('Marking an item done, and the score not moving');
  await page.getByRole('button', { name: 'Mark done' }).first().click();
  await page.waitForSelector('text=What changed', { timeout: 120_000 });
  await pause(page, BEAT.short);
  await shot(page, 'progress-marked-done');
  await pause(page, BEAT.long);

  mark('Linking the repository that proves the work');
  await page
    .getByLabel('Repository URL or owner/name')
    .fill('riya-sharma-demo/ml-deploy-service', { timeout: 15_000 });
  await pause(page, BEAT.short);
  await page.getByRole('button', { name: 'Scan repository' }).click();
  await page.waitForSelector('text=Readiness moved', { timeout: 120_000 });
  await pause(page, BEAT.read);
  await shot(page, 'progress-replan');

  // The narration says she then proves Docker and retakes SQL. Those really
  // happen, through the API rather than on camera, so the closing number is a
  // result rather than a claim and the video stays inside three minutes.
  step('docker quiz and sql retake, off camera');
  await quizByApi(profileId, 'Docker');
  await quizByApi(profileId, 'SQL');

  mark('Back to the dashboard with the new score');
  await page.goto(`${BASE}/dashboard/${profileId}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Readiness for');
  await pause(page, BEAT.hold);
  await shot(page, 'dashboard-final');
  mark('Closing on the score history chart');
  await page.locator('text=Score history').scrollIntoViewIfNeeded();
  await pause(page, BEAT.read);
  await shot(page, 'score-history');
  await pause(page, BEAT.hold);

  return profileId;
}

async function main(): Promise<void> {
  await rm(SHOTS, { recursive: true, force: true });
  await mkdir(SHOTS, { recursive: true });
  if (RECORD_VIDEO) {
    await mkdir(VIDEO, { recursive: true });
    // Playwright names recordings randomly, so a previous run left behind would
    // otherwise be mistaken for this one.
    await rm(path.join(VIDEO, 'raw-demo.webm'), { force: true });
  }

  const browser = await chromium.launch({ slowMo: RECORD_VIDEO ? 70 : 0 });
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
    const withTimes = await Promise.all(
      files.map(async (file) => ({ file, at: (await stat(path.join(VIDEO, file))).mtimeMs })),
    );
    const newest = withTimes.sort((a, b) => a.at - b.at).at(-1)?.file;
    if (newest) await rename(path.join(VIDEO, newest), path.join(VIDEO, 'raw-demo.webm'));
    await writeFile(
      path.join(VIDEO, 'timings.json'),
      `${JSON.stringify({ total_seconds: marks.at(-1)?.at ?? 0, marks }, null, 2)}\n`,
      'utf8',
    );
    process.stdout.write('Video: docs/video/raw-demo.webm, beats: docs/video/timings.json\n');
    for (const entry of marks) {
      process.stdout.write(`  ${formatClock(entry.at)}  ${entry.phase}\n`);
    }
  }
  process.stdout.write(
    `${shotIndex} screenshots in docs/screenshots/deck\nProfile: ${BASE}/dashboard/${profileId}\n`,
  );
}

function formatClock(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
