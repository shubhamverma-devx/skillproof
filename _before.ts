import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { loadAnswerKey, normalise } from './scripts/demo-answers';

const BASE = 'http://localhost:3100';
const OUT = path.join(process.cwd(), 'docs', 'redesign', 'before');
const key = loadAnswerKey();

async function api<T>(route: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${route}`, init);
  const j = (await r.json()) as { data?: T; error?: string };
  if (j.error) throw new Error(`${route}: ${j.error}`);
  return j.data as T;
}

async function seedDemo(): Promise<string> {
  const { id } = await api<{ id: string }>('/api/profile', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ demo: true }),
  });
  await (await fetch(`${BASE}/api/analyze/${id}`, { method: 'POST' })).text();
  await api(`/api/roadmap/${id}/generate`, { method: 'POST' });
  // One quiz so the dashboard shows a tested skill.
  type Start = { attempt_id: string; question: { question: string } };
  type Answer = { next: { question: string } | null; result: unknown };
  const start = await api<Start>(`/api/quiz/${id}/start`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: 'Python' }),
  });
  let q = start.question;
  for (;;) {
    const res = await api<Answer>(`/api/quiz/${id}/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempt_id: start.attempt_id, answer_index: key.get(normalise(q.question)) ?? 0 }),
    });
    if (res.result || !res.next) break;
    q = res.next;
  }
  return id;
}

async function seedGithubOnly(): Promise<string> {
  const form = new FormData();
  form.set('name', 'Aarav Singh');
  form.set('target_role', 'frontend-developer');
  form.set('weekly_hours', '6');
  form.set('github_username', 'gaearon');
  form.set('resume_text', 'Final year student looking for opportunities. I enjoy building things and solving problems. Hobbies include reading and cricket. References available on request.');
  const { id } = await api<{ id: string }>('/api/profile', { method: 'POST', body: form });
  await (await fetch(`${BASE}/api/analyze/${id}`, { method: 'POST' })).text();
  return id;
}

async function shoot(page: Page, route: string, name: string, theme: 'light' | 'dark') {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const demo = await seedDemo();
  const ghOnly = await seedGithubOnly();
  console.log('demo profile:', demo);
  console.log('github-only profile:', ghOnly);

  const routes: Array<[string, string]> = [
    ['/', 'landing'],
    ['/start', 'onboarding'],
    [`/dashboard/${demo}`, 'dashboard'],
    [`/roadmap/${demo}`, 'roadmap'],
    [`/progress/${demo}`, 'progress'],
    [`/quiz/${demo}?skill=SQL`, 'quiz'],
    [`/dashboard/${ghOnly}`, 'dashboard-github-only'],
  ];

  const browser = await chromium.launch();
  for (const [w, label] of [[1440, 'desktop'], [390, 'mobile']] as const) {
    for (const theme of ['light', 'dark'] as const) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, colorScheme: theme });
      const page = await ctx.newPage();
      for (const [route, name] of routes) await shoot(page, route, `${name}-${label}-${theme}`, theme);
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`${routes.length * 4} screenshots in docs/redesign/before`);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
