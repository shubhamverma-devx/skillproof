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
import { playQuiz, quizByApi } from './demo-quiz';

const BASE = process.env.DEMO_BASE ?? 'http://localhost:3000';
const RECORD_VIDEO = process.argv.includes('--video');
const SHOTS = path.join(process.cwd(), 'docs', 'screenshots', 'deck');
const VIDEO = path.join(process.cwd(), 'docs', 'video');

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

/**
 * The quiz beats carry the shortest narration lines of the demo, so they run
 * tighter than the rest and give their slack back to the dashboard.
 */
const QUIZ_PAUSE = 1000;

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

/** What the quiz player needs from the recorder: pacing and capture. */
const quizContext = {
  pause,
  shot,
  step,
  clickPause: BEAT.short,
  readPause: QUIZ_PAUSE,
};

async function run(page: Page): Promise<string> {
  startedAt = Date.now();
  mark('The problem, on the landing page');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await pause(page, BEAT.hold + EXTRA_DWELL);
  await shot(page, 'landing');

  await page.getByRole('button', { name: 'See a demo' }).click();

  mark('The agent works in the open');
  await page.waitForURL('**/analyze/**');
  await pause(page, 1200);
  await shot(page, 'analysis');
  await page.waitForURL('**/dashboard/**', { timeout: 120_000 });
  const profileId = page.url().split('/dashboard/')[1] ?? '';

  mark('The score and the Proof Meter');
  await page.getByRole('heading', { name: /ready for .* roles\./ }).waitFor();

  // The first visit tour floats over the page. It is worth a beat on camera,
  // then it is dismissed so it does not sit on top of the rest of the demo.
  const skipTour = page.getByRole('button', { name: 'Skip' });
  if (await skipTour.isVisible().catch(() => false)) {
    await pause(page, BEAT.long);
    await skipTour.click();
  }

  await pause(page, BEAT.hold);
  await shot(page, 'overview');

  // The narration reads the score, the meter and the ceiling over this beat, so
  // the recording holds on the whole card rather than cutting away early.
  await pause(page, BEAT.hold + BEAT.read * 2 + EXTRA_DWELL);

  mark('Every skill, and what backs it up');
  await page.goto(`${BASE}/skills/${profileId}`, { waitUntil: 'networkidle' });
  await pause(page, BEAT.read);
  await shot(page, 'skills');
  await page.getByRole('button', { name: /^SQL/ }).first().click();
  await pause(page, BEAT.read);
  await shot(page, 'evidence-sql');
  await pause(page, BEAT.long);
  await page.keyboard.press('Escape');

  mark('Verifying Python');
  await page.goto(`${BASE}/quiz/${profileId}?skill=Python`, { waitUntil: 'networkidle' });
  await shot(page, 'quiz-start');
  await playQuiz(page, 'Python', 0, quizContext);

  mark('Verifying SQL, the claimed but weak skill');
  await page.goto(`${BASE}/quiz/${profileId}?skill=SQL`, { waitUntil: 'networkidle' });
  await playQuiz(page, 'SQL', 3, quizContext);

  mark('Building the roadmap');
  await page.goto(`${BASE}/roadmap/${profileId}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Build my plan' }).click();
  await page.waitForSelector('text=Approve plan', { timeout: 120_000 });
  await pause(page, BEAT.read);
  await shot(page, 'roadmap');

  mark('Opening a roadmap item and its proof project');
  await page.locator('button:has-text("about")').first().click();
  await pause(page, BEAT.hold);
  await shot(page, 'roadmap-item');
  await page.keyboard.press('Escape');

  mark('Approving the roadmap');
  await page.getByRole('button', { name: 'Approve plan' }).click();
  await page.waitForSelector('text=approved', { timeout: 60_000 });
  await pause(page, BEAT.short);

  mark('Logging progress');
  await page.goto(`${BASE}/progress/${profileId}`, { waitUntil: 'networkidle' });
  await pause(page, BEAT.read);

  mark('Marking an item done, and the score not moving');
  await page.getByRole('button', { name: 'Done', exact: true }).first().click();
  await page.waitForSelector('text=/Your score (went to|stayed at)/', { timeout: 120_000 });
  await pause(page, BEAT.short);
  await shot(page, 'progress-marked-done');
  await pause(page, BEAT.long);

  mark('Linking the repository that proves the work');
  await page
    .getByLabel('Repository address')
    .fill('riya-sharma-demo/ml-deploy-service', { timeout: 15_000 });
  await pause(page, BEAT.short);
  await page.getByRole('button', { name: 'Scan it' }).click();
  await page.waitForSelector('text=/Your score went to/', { timeout: 120_000 });
  await pause(page, BEAT.read);
  await shot(page, 'progress-replan');

  // The narration says she then proves Docker and retakes SQL. Those really
  // happen, through the API rather than on camera, so the closing number is a
  // result rather than a claim and the video stays inside three minutes.
  step('docker quiz and sql retake, off camera');
  await quizByApi(BASE, profileId, 'Docker');
  await quizByApi(BASE, profileId, 'SQL');

  mark('Back to the dashboard with the new score');
  await page.goto(`${BASE}/dashboard/${profileId}`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /ready for .* roles\./ }).waitFor();
  await pause(page, BEAT.hold + EXTRA_DWELL);
  await shot(page, 'overview-final');
  mark('Closing on the score history chart');
  await page.locator('text=Your score over time').scrollIntoViewIfNeeded();
  await pause(page, BEAT.read);
  await shot(page, 'score-history');
  // The closing line and the tagline both land over this chart, so it holds.
  await pause(page, BEAT.hold + EXTRA_DWELL);

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
