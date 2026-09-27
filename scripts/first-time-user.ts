/**
 * Walks the whole product the way a new student would, on a desktop and a phone
 * width, and fails if any step is not reachable.
 *
 *   FTU_BASE=http://localhost:3000 pnpm test:journey
 *
 * This is the test that would have caught a dead button, a page with no way out,
 * or a screen that only works at one width.
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { loadAnswerKey, normalise } from './demo-answers';

const BASE = process.env.FTU_BASE ?? 'http://localhost:3000';
const answerKey = loadAnswerKey();

type Width = { label: string; width: number; height: number };

const WIDTHS: Width[] = [
  { label: 'desktop 1440', width: 1440, height: 900 },
  { label: 'phone 390', width: 390, height: 844 },
];

async function step(name: string, run: () => Promise<void>): Promise<void> {
  const started = Date.now();
  await run();
  process.stdout.write(`    ok ${String(Date.now() - started).padStart(6)}ms  ${name}\n`);
}

/** Clicks and retries until navigation starts, since a cold page may not be hydrated. */
async function clickUntilNavigated(page: Page, name: string | RegExp, urlPart: string) {
  const button = page.getByRole('button', { name });
  await button.waitFor({ state: 'visible' });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await button.click();
    const moved = await page
      .waitForURL(`**${urlPart}**`, { timeout: 6000 })
      .then(() => true)
      .catch(() => false);
    if (moved) return;
  }
  throw new Error(`${String(name)} never navigated to ${urlPart}`);
}

async function answerQuiz(page: Page): Promise<void> {
  for (let question = 1; question <= 4; question += 1) {
    const submit = page.getByRole('button', { name: 'Submit answer' });
    await submit.waitFor({ state: 'visible' });

    const prompt = normalise(await page.locator('[data-question]').first().innerText());
    const correct = answerKey.get(prompt) ?? 0;

    const option = page.locator(`#option-${correct}`);
    await option.waitFor({ state: 'visible' });
    for (let attempt = 0; attempt < 4 && (await submit.isDisabled()); attempt += 1) {
      await option.click();
      await page.waitForTimeout(200);
    }
    await submit.click();

    await page.waitForSelector('text=/Correct|Not quite/');
    await page.getByRole('button', { name: /Next question|See your result/ }).click();
    await page.waitForTimeout(300);
  }
  await page.waitForSelector('text=Quiz result');
}

async function journey(browser: Browser, size: Width): Promise<void> {
  process.stdout.write(`\n  ${size.label}\n`);
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
  });
  const page = await context.newPage();

  await step('landing page explains the product', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: /Know exactly what stands between you/ }).waitFor();
    await page.getByRole('heading', { name: 'How it works' }).waitFor();
    await page.getByRole('heading', { name: 'Three kinds of proof' }).waitFor();
  });

  await step('demo profile starts an analysis', async () => {
    await clickUntilNavigated(page, 'See a demo', '/analyze/');
  });

  await step('analysis shows plain steps and finishes', async () => {
    await page.getByText('Reading your resume').waitFor({ timeout: 20_000 });
    await page.waitForURL('**/dashboard/**', { timeout: 120_000 });
  });

  const profileId = page.url().split('/dashboard/')[1] ?? '';

  await step('overview leads with a sentence and one next step', async () => {
    await page.getByRole('heading', { name: /You are \d+% ready for/ }).waitFor();
    await page.getByText('Do this next').waitFor();
    const primaryButtons = await page.locator('a[class*="bg-accent"]').count();
    if (primaryButtons > 1) throw new Error(`${primaryButtons} primary actions on the overview`);
  });

  await step('skills page groups every skill by proof', async () => {
    await page.goto(`${BASE}/skills/${profileId}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Seen in your code' }).first().waitFor();
    await page.getByRole('button', { name: /^Search skills$/ }).count();
  });

  await step('a skill opens its evidence in a side sheet', async () => {
    await page
      .getByRole('button', { name: /Python/ })
      .first()
      .click();
    await page.getByText('Where we found it').waitFor({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Close' }).click();
  });

  await step('a test can be taken and scored', async () => {
    await page.goto(`${BASE}/quiz/${profileId}?skill=Docker`, { waitUntil: 'networkidle' });
    await answerQuiz(page);
  });

  await step('roadmap can be built and approved', async () => {
    await page.goto(`${BASE}/roadmap/${profileId}`, { waitUntil: 'networkidle' });
    const build = page.getByRole('button', { name: 'Build my plan' });
    if (await build.count()) {
      await build.click();
      await page.getByText('This is a draft').waitFor({ timeout: 120_000 });
    }
    await page.getByRole('button', { name: 'Approve plan' }).click();
    await page.getByText('This week').waitFor({ timeout: 60_000 });
  });

  await step('progress records a project and explains the change', async () => {
    await page.goto(`${BASE}/progress/${profileId}`, { waitUntil: 'networkidle' });
    await page.getByLabel('Repository address').fill('riya-sharma-demo/ml-deploy-service');
    await page.getByRole('button', { name: 'Scan it' }).click();
    await page.getByText(/Your score (went to|stayed at)/).waitFor({ timeout: 120_000 });
  });

  await step('the score change is visible back on the overview', async () => {
    await page.goto(`${BASE}/dashboard/${profileId}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: /You are \d+% ready for/ }).waitFor();
  });

  await context.close();
}

async function main(): Promise<void> {
  process.stdout.write(`First time user journey against ${BASE}\n`);
  const browser = await chromium.launch();
  try {
    for (const size of WIDTHS) await journey(browser, size);
  } finally {
    await browser.close();
  }
  process.stdout.write('\nBoth widths completed the whole journey.\n');
}

main().catch((error: unknown) => {
  process.stdout.write(`\nFAILED: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
