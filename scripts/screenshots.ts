/**
 * Captures the screenshots used in the README and in the design review loop.
 *
 *   pnpm dev                                        in one terminal
 *   pnpm screenshots <profileId> [githubOnlyId]      in another
 *
 * Both themes at desktop and phone width, so layout and contrast problems show
 * up before they reach a reviewer. SCREENSHOT_OUT points the run at a different
 * folder, which is how the redesign review loop fills docs/redesign/after.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';

const BASE = process.env.SCREENSHOT_BASE ?? 'http://localhost:3000';
const OUT = process.env.SCREENSHOT_OUT
  ? path.resolve(process.cwd(), process.env.SCREENSHOT_OUT)
  : path.join(process.cwd(), 'docs', 'screenshots');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

async function shoot(page: Page, route: string, name: string, theme: 'light' | 'dark') {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
    localStorage.setItem('skillproof-theme', value);
    // The first visit tour floats over the page, so it would cover whatever sits
    // under it in a full page capture.
    localStorage.setItem('skillproof-tour-seen', 'true');
  }, theme);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  process.stdout.write(`  ${name}.png\n`);
}

async function run() {
  const profileId = process.argv[2];
  const githubOnlyId = process.argv[3];
  if (!profileId) throw new Error('Usage: pnpm screenshots <profileId> [githubOnlyId]');

  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  const routes: Array<[string, string]> = [
    ['/', 'landing'],
    ['/start', 'onboarding'],
    [`/dashboard/${profileId}`, 'overview'],
    [`/skills/${profileId}`, 'skills'],
    [`/roadmap/${profileId}`, 'roadmap'],
    [`/quiz/${profileId}?skill=SQL`, 'quiz'],
    [`/progress/${profileId}`, 'progress'],
  ];

  if (githubOnlyId) {
    routes.push([`/dashboard/${githubOnlyId}`, 'overview-github-only']);
  }

  for (const viewport of VIEWPORTS) {
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 2,
        colorScheme: theme,
      });
      const page = await context.newPage();
      for (const [route, name] of routes) {
        await shoot(page, route, `${name}-${viewport.name}-${theme}`, theme);
      }
      await context.close();
    }
  }

  await browser.close();
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
