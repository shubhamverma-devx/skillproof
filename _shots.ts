import { mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';

const BASE = 'http://localhost:3100';
const OUT = path.join(process.cwd(), 'docs', 'redesign', 'after');
const { demo, ghOnly } = JSON.parse(readFileSync('/tmp/ids.json', 'utf8')) as { demo: string; ghOnly: string };

async function shoot(page: Page, route: string, name: string, theme: 'light' | 'dark') {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('skillproof-tour-seen', 'true');
  }, theme);
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

(async () => {
  await mkdir(OUT, { recursive: true });
  const routes: Array<[string, string]> = [
    ['/', 'landing'],
    ['/start', 'onboarding'],
    [`/dashboard/${demo}`, 'overview'],
    [`/skills/${demo}`, 'skills'],
    [`/roadmap/${demo}`, 'roadmap'],
    [`/progress/${demo}`, 'progress'],
    [`/quiz/${demo}?skill=SQL`, 'quiz'],
    [`/dashboard/${ghOnly}`, 'overview-github-only'],
  ];
  const b = await chromium.launch();
  for (const [w, label] of [[1440, 'desktop'], [390, 'mobile']] as const) {
    for (const theme of ['light', 'dark'] as const) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, colorScheme: theme });
      const page = await ctx.newPage();
      for (const [route, name] of routes) await shoot(page, route, `${name}-${label}-${theme}`, theme);
      await ctx.close();
    }
  }
  await b.close();
  console.log(`${routes.length * 4} screenshots in docs/redesign/after`);
})();
