/**
 * Smoke tests a deployed SkillProof against the things that break in production
 * but not locally: cold starts, streaming through a proxy, and function limits.
 *
 *   SMOKE_BASE=https://your-deployment pnpm smoke
 *
 * Prints a timing for every step and exits non zero on the first failure, so it
 * can gate a deploy.
 */
import { chromium, type Page } from '@playwright/test';

const BASE = process.env.SMOKE_BASE ?? process.env.DEMO_BASE ?? 'http://localhost:3000';
const LIVE_GITHUB_USER = process.env.SMOKE_GITHUB_USER ?? 'shubhamverma-devx';

type Result = { step: string; ms: number; detail: string };
const results: Result[] = [];

async function timed<T>(step: string, run: () => Promise<[T, string]>): Promise<T> {
  const started = Date.now();
  const [value, detail] = await run();
  const ms = Date.now() - started;
  results.push({ step, ms, detail });
  process.stdout.write(`  ok  ${String(ms).padStart(6)}ms  ${step}: ${detail}\n`);
  return value;
}

async function api<T>(route: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${route}`, init);
  const payload = (await response.json()) as { data?: T; error?: string };
  if (payload.error) throw new Error(`${route}: ${payload.error}`);
  return payload.data as T;
}

async function checkLanding(page: Page): Promise<void> {
  await timed('landing page', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Skills proven, not claimed' }).waitFor();
    const storageWarning = await page.getByText('Storage is not configured').count();
    if (storageWarning > 0) throw new Error('the deployment has no database configured');
    return [null, 'headline rendered, storage configured'];
  });
}

async function checkDemoProfile(page: Page): Promise<string> {
  const id = await timed('demo profile analysis', async () => {
    // A click before React hydrates does nothing, and on a cold serverless start
    // hydration can land well after the markup, so the click is retried.
    const demoButton = page.getByRole('button', { name: 'Load demo profile' });
    await demoButton.waitFor({ state: 'visible' });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await demoButton.click();
      const navigated = await page
        .waitForURL('**/analyze/**', { timeout: 6000 })
        .then(() => true)
        .catch(() => false);
      if (navigated) break;
      if (attempt === 4) throw new Error('the demo button never started an analysis');
    }
    // The stream has to produce its first step quickly or a proxy may treat the
    // connection as idle.
    await page.getByText('Agent started').waitFor({ timeout: 15_000 });
    await page.waitForURL('**/dashboard/**', { timeout: 120_000 });
    const profileId = page.url().split('/dashboard/')[1] ?? '';
    await page.getByText('Readiness for').waitFor();
    return [profileId, `profile ${profileId.slice(0, 8)} reached the dashboard`];
  });

  await timed('quiz round trip', async () => {
    type Start = { attempt_id: string; question: { options: string[] } };
    const start = await api<Start>(`/api/quiz/${id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill: 'Python' }),
    });
    return [null, `first question served with ${start.question.options.length} options`];
  });

  await timed('roadmap generation', async () => {
    const built = await api<{ items: unknown[] }>(`/api/roadmap/${id}/generate`, {
      method: 'POST',
    });
    return [null, `${built.items.length} items planned`];
  });

  await timed('state after writes', async () => {
    const state = await api<{ score: number; history: unknown[] }>(`/api/profile/${id}`);
    if (state.history.length === 0) throw new Error('score history is empty, reads may be cached');
    return [null, `score ${state.score} with ${state.history.length} history rows`];
  });

  return id;
}

async function checkLiveAnalysis(): Promise<void> {
  await timed('live github analysis', async () => {
    const form = new FormData();
    form.set('name', 'Smoke test');
    form.set('target_role', 'frontend-developer');
    form.set('weekly_hours', '8');
    form.set(
      'resume_text',
      [
        'Final year B.Tech student in computer science.',
        'Coursework in data structures, databases and operating systems.',
        'Projects are on GitHub. Comfortable with Git and the command line.',
        'Looking for a software engineering role.',
      ].join(' '),
    );
    form.set('github_username', LIVE_GITHUB_USER);

    const created = await api<{ id: string }>('/api/profile', { method: 'POST', body: form });
    const response = await fetch(`${BASE}/api/analyze/${created.id}`, { method: 'POST' });
    const body = await response.text();

    if (response.status === 429) {
      throw new Error(
        'rate limited: this IP has already run several analyses in the current window, which is the limiter working. Wait for the window or run from another network.',
      );
    }
    if (!body.includes('"type":"done"')) throw new Error('the analysis stream never completed');

    const state = await api<{ score: number; github: { scanned_repos: number } }>(
      `/api/profile/${created.id}`,
    );
    return [null, `${LIVE_GITHUB_USER}: ${state.github.scanned_repos} repos, score ${state.score}`];
  });
}

async function main(): Promise<void> {
  process.stdout.write(`Smoke testing ${BASE}\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await checkLanding(page);
    await checkDemoProfile(page);
    await checkLiveAnalysis();
  } finally {
    await browser.close();
  }

  const slowest = [...results].sort((a, b) => b.ms - a.ms)[0];
  process.stdout.write(
    `\nAll ${results.length} checks passed. Slowest: ${slowest?.step} at ${slowest?.ms}ms.\n`,
  );
}

main().catch((error: unknown) => {
  process.stdout.write(`\nFAILED: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
