/**
 * Replays the demo storyline against a running server and prints the readiness
 * score after every step. Run this before recording the demo video: if any
 * number here looks wrong, the demo will look wrong too.
 *
 *   pnpm dev                 in one terminal
 *   pnpm demo:verify         in another
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.DEMO_BASE ?? 'http://localhost:3000';

type QuizResult = { score: number; readiness: number; verified: boolean };

/** Correct answers for the offline bank, so the script can play a strong student. */
function loadAnswerKey(): Map<string, number> {
  const directory = path.join(process.cwd(), 'data', 'question_bank');
  const key = new Map<string, number>();
  for (const file of readdirSync(directory)) {
    const parsed = JSON.parse(readFileSync(path.join(directory, file), 'utf8')) as {
      questions: Array<{ question: string; correct_index: number }>;
    };
    for (const question of parsed.questions) key.set(question.question, question.correct_index);
  }
  return key;
}

async function post<T>(route: string, body: unknown = {}): Promise<T> {
  const response = await fetch(`${BASE}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { data?: T; error?: string };
  if (payload.error) throw new Error(`${route}: ${payload.error}`);
  return payload.data as T;
}

async function get<T>(route: string): Promise<T> {
  const payload = (await (await fetch(`${BASE}${route}`)).json()) as { data?: T; error?: string };
  if (payload.error) throw new Error(`${route}: ${payload.error}`);
  return payload.data as T;
}

const answerKey = loadAnswerKey();

/** Plays one quiz, answering wrongly from `wrongFrom` onwards to simulate a weak skill. */
async function runQuiz(profileId: string, skill: string, wrongFrom = Number.MAX_SAFE_INTEGER) {
  type Start = { attempt_id: string; question: { question: string } };
  type Answer = { next: { question: string } | null; result: QuizResult | null };

  const start = await post<Start>(`/api/quiz/${profileId}/start`, { skill });
  let question = start.question;

  for (let step = 0; ; step += 1) {
    const correct = answerKey.get(question.question) ?? 0;
    const answer = step >= wrongFrom ? (correct + 1) % 4 : correct;
    const reply = await post<Answer>(`/api/quiz/${profileId}/answer`, {
      attempt_id: start.attempt_id,
      answer_index: answer,
    });
    if (reply.result) return reply.result;
    if (!reply.next) throw new Error('The quiz ended without a result');
    question = reply.next;
  }
}

async function main(): Promise<void> {
  const { id } = await post<{ id: string }>('/api/profile', { demo: true });
  await (await fetch(`${BASE}/api/analyze/${id}`, { method: 'POST' })).text();

  type State = {
    score: number;
    roadmap: { roadmap: { version: number }; items: Array<{ id: string; skill: string; week: number }> } | null;
    history: Array<{ score: number }>;
    assessments: Array<{ skill: string; level: string }>;
  };

  let state = await get<State>(`/api/profile/${id}`);
  process.stdout.write(`1. Analysis complete, readiness ${state.score}\n`);

  const python = await runQuiz(id, 'Python');
  process.stdout.write(`2. Python quiz ${pct(python.score)}, readiness ${python.readiness}\n`);

  const sql = await runQuiz(id, 'SQL', 1);
  process.stdout.write(`3. SQL quiz ${pct(sql.score)}, readiness ${sql.readiness}\n`);

  await post(`/api/roadmap/${id}/generate`);
  await post(`/api/roadmap/${id}/approve`);
  state = await get<State>(`/api/profile/${id}`);
  const items = state.roadmap?.items ?? [];
  process.stdout.write(
    `4. Roadmap version ${state.roadmap?.roadmap.version} approved, ${items.length} items over ${Math.max(...items.map((item) => item.week))} weeks\n`,
  );

  for (const item of items.slice(0, 2)) {
    await post(`/api/progress/${id}`, { type: 'item_status', item_id: item.id, status: 'done' });
  }
  process.stdout.write(`5. Marked ${items.slice(0, 2).map((item) => item.skill).join(' and ')} done\n`);

  const repo = await post<{ summary: string; changes: string[] }>(`/api/progress/${id}`, {
    type: 'repo',
    repo: 'riya-sharma-demo/ml-deploy-service',
  });
  process.stdout.write(`6. Linked ml-deploy-service. ${repo.summary}\n`);
  for (const change of repo.changes.slice(0, 3)) process.stdout.write(`   ${change}\n`);

  const docker = await runQuiz(id, 'Docker');
  process.stdout.write(`7. Docker quiz ${pct(docker.score)}, readiness ${docker.readiness}\n`);

  const sqlRetake = await runQuiz(id, 'SQL');
  process.stdout.write(`8. SQL retake ${pct(sqlRetake.score)}, readiness ${sqlRetake.readiness}\n`);

  state = await get<State>(`/api/profile/${id}`);
  process.stdout.write(`\nScore history: ${state.history.map((entry) => entry.score).join(' to ')}\n`);
  process.stdout.write(
    `Verified skills: ${state.assessments.filter((a) => a.level === 'verified').map((a) => a.skill).join(', ')}\n`,
  );
  process.stdout.write(`Dashboard: ${BASE}/dashboard/${id}\n`);
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
