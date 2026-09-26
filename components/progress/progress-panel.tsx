'use client';

import { FolderGit2, ListChecks, RefreshCw, Timer } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FieldHint, Input, Label } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import { Slider } from '@/components/ui/slider';
import { postJson } from '@/lib/client/api';
import { WEEKLY_HOURS } from '@/lib/config';
import type { ProfileState, ProgressEvent, ProgressResult } from '@/types/api';

export function ProgressPanel({ state }: { state: ProfileState }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [repo, setRepo] = useState('');
  const [hours, setHours] = useState<number>(state.profile.weekly_hours);
  const [result, setResult] = useState<ProgressResult | null>(null);

  const openItems = (state.roadmap?.items ?? []).filter(
    (item) => item.status !== 'done' && item.status !== 'skipped',
  );
  const tested = state.assessments.filter((assessment) => assessment.tested);

  async function send(event: ProgressEvent, message: string) {
    setBusy(true);
    const response = await postJson<ProgressResult>(`/api/progress/${state.profile.id}`, event);
    setBusy(false);
    if ('error' in response) return toast.error(response.error);
    toast.success(message);
    setResult(response.data);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {result ? <ResultBanner result={result} /> : null}

      <Panel className="px-5 py-5">
        <Card
          icon={FolderGit2}
          title="Link a project"
          body="The fastest way to move your score. We read the repository, note which file proves which skill, and rebuild the rest of your plan around it."
        />
        <div className="mt-4">
          <Label htmlFor="repo">Repository address</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input
              id="repo"
              className="min-w-56 flex-1"
              value={repo}
              placeholder="your-name/your-project"
              onChange={(event) => setRepo(event.target.value)}
            />
            <Button
              disabled={busy || (repo.trim().length < 3 && !state.demo)}
              onClick={() => send({ type: 'repo', repo: repo.trim() }, 'Project scanned')}
            >
              Scan it
            </Button>
          </div>
          <FieldHint className="mt-2">
            {state.demo
              ? 'On the sample student this replays a recorded scan instead of calling GitHub.'
              : 'It has to be public. We never read private repositories.'}
          </FieldHint>
        </div>
      </Panel>

      <Panel className="px-5 py-5">
        <Card
          icon={ListChecks}
          title="Mark tasks done"
          body="This records your progress and rebuilds the weeks ahead. It does not move your score on its own: that needs proof, which means a project or a test."
        />
        {openItems.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Nothing open right now. Build or rebuild a plan to get new tasks.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y border-t">
            {openItems.slice(0, 6).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="tabular text-xs text-ink-faint">
                    Week {item.week} · {item.skill} · about {item.est_hours} hours
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    send(
                      { type: 'item_status', item_id: item.id, status: 'done' },
                      'Marked as done',
                    )
                  }
                >
                  Done
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="px-5 py-5">
          <Card
            icon={RefreshCw}
            title="Take a test again"
            body="A newer score replaces the old one, so come back after you have learnt something."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {tested.length === 0 ? (
              <p className="text-sm text-ink-muted">
                You have not been tested on anything yet. Start from the Skills page.
              </p>
            ) : (
              tested.map((assessment) => (
                <Button key={assessment.skill} asChild variant="secondary" size="sm">
                  <Link
                    href={`/quiz/${state.profile.id}?skill=${encodeURIComponent(assessment.skill)}`}
                  >
                    {assessment.skill}, last {Math.round((assessment.verified_score ?? 0) * 100)}%
                  </Link>
                </Button>
              ))
            )}
          </div>
        </Panel>

        <Panel className="px-5 py-5">
          <Card
            icon={Timer}
            title="Change your weekly hours"
            body="The plan is repacked so no week asks for more time than you have."
          />
          <div className="mt-4">
            <Label htmlFor="hours">
              Hours a week: <span className="tabular font-semibold">{hours}</span>
            </Label>
            <Slider
              id="hours"
              className="mt-3"
              value={[hours]}
              min={WEEKLY_HOURS.min}
              max={WEEKLY_HOURS.max}
              step={WEEKLY_HOURS.step}
              onValueChange={([value]) => setHours(value ?? WEEKLY_HOURS.default)}
            />
            <Button
              className="mt-4"
              variant="secondary"
              disabled={busy || hours === state.profile.weekly_hours}
              onClick={() => send({ type: 'weekly_hours', weekly_hours: hours }, 'Hours saved')}
            >
              Save and rebuild the plan
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof FolderGit2;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        <p className="mt-0.5 max-w-prose text-sm text-ink-muted">{body}</p>
      </div>
    </div>
  );
}

/** The payoff moment, written as a sentence a person would say out loud. */
function ResultBanner({ result }: { result: ProgressResult }) {
  const moved = result.delta !== null && result.delta !== 0;
  return (
    <section
      className="rounded-panel border border-accent/25 bg-accent/[0.04] px-5 py-4"
      aria-live="polite"
    >
      <p className="text-base font-medium">
        {moved
          ? `Your score went to ${Math.round(result.score)}.`
          : `Your score stayed at ${Math.round(result.score)}.`}
      </p>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        {moved
          ? result.summary
          : 'That is expected: marking something done is a claim, not proof. Link the project you built or take a test, and it will move.'}
      </p>
      {result.changes.length > 0 ? (
        <ul className="mt-2.5 flex flex-col gap-1">
          {result.changes.slice(0, 5).map((change) => (
            <li key={change} className="flex gap-2 text-sm text-ink-muted">
              <span
                aria-hidden="true"
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint"
              />
              {change}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
