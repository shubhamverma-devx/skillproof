'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChangesBox } from '@/components/roadmap/changes-box';
import { Button } from '@/components/ui/button';
import { FieldHint, Input, Label } from '@/components/ui/field';
import { Panel, PanelHeader, PanelNote, PanelTitle } from '@/components/ui/panel';
import { Slider } from '@/components/ui/slider';
import { postJson } from '@/lib/client/api';
import { WEEKLY_HOURS } from '@/lib/config';
import { formatPercent } from '@/lib/utils';
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
  const testedSkills = state.assessments.filter((assessment) => assessment.tested);

  async function send(event: ProgressEvent, message: string) {
    setBusy(true);
    const response = await postJson<ProgressResult>(`/api/progress/${state.profile.id}`, event);
    setBusy(false);
    if ('error' in response) {
      toast.error(response.error);
      return;
    }
    toast.success(message);
    setResult(response.data);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {result ? <ChangesBox changes={result.changes} summary={result.summary} /> : null}

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Link a repository</PanelTitle>
            <PanelNote>
              The fastest way to move your score. We scan the repository, record which file proves
              which skill, and replan what is left.
            </PanelNote>
          </div>
        </PanelHeader>
        <div className="px-5 py-4">
          <Label htmlFor="repo">Repository URL or owner/name</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input
              id="repo"
              className="min-w-56 flex-1"
              value={repo}
              placeholder="riya-sharma-demo/ml-deploy-service"
              onChange={(event) => setRepo(event.target.value)}
            />
            <Button
              disabled={busy || (repo.trim().length < 3 && !state.demo)}
              onClick={() => send({ type: 'repo', repo: repo.trim() }, 'Repository scanned')}
            >
              Scan repository
            </Button>
          </div>
          <FieldHint className="mt-2">
            {state.demo
              ? 'On the demo profile this replays the cached scan of ml-deploy-service instead of calling GitHub.'
              : 'The repository must be public. Private repositories are never read.'}
          </FieldHint>
        </div>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Mark roadmap items</PanelTitle>
            <PanelNote>
              Marking an item done records your progress and replans the rest. It does not raise
              your score on its own: that needs evidence, which means a repository or a quiz.
            </PanelNote>
          </div>
        </PanelHeader>
        {openItems.length === 0 ? (
          <p className="px-5 py-4 text-ui-sm text-muted">
            No open roadmap items. Build or rebuild a roadmap to get a new plan.
          </p>
        ) : (
          <ul className="divide-y">
            {openItems.slice(0, 8).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="tabular text-ui-sm text-muted">
                    Week {item.week}, {item.skill}, {item.est_hours} hours
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      send(
                        { type: 'item_status', item_id: item.id, status: 'done' },
                        'Item marked done',
                      )
                    }
                  >
                    Mark done
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      send(
                        { type: 'item_status', item_id: item.id, status: 'skipped' },
                        'Item skipped',
                      )
                    }
                  >
                    Skip
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Retake a quiz</PanelTitle>
            <PanelNote>
              A newer attempt replaces the old score, so retake one after you have learnt the skill.
            </PanelNote>
          </div>
        </PanelHeader>
        <div className="flex flex-wrap gap-2 px-5 py-4">
          {testedSkills.length === 0 ? (
            <p className="text-ui-sm text-muted">
              You have not verified any skill yet. Start from the skills table on your dashboard.
            </p>
          ) : (
            testedSkills.map((assessment) => (
              <Button key={assessment.skill} asChild variant="outline" size="sm">
                <Link
                  href={`/quiz/${state.profile.id}?skill=${encodeURIComponent(assessment.skill)}`}
                >
                  {assessment.skill}, last {formatPercent(assessment.verified_score ?? 0)}
                </Link>
              </Button>
            ))
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Change your weekly hours</PanelTitle>
            <PanelNote>The plan is repacked so no week goes past the new budget.</PanelNote>
          </div>
        </PanelHeader>
        <div className="px-5 py-4">
          <Label htmlFor="hours">
            Hours a week: <span className="tabular font-semibold">{hours}</span>
          </Label>
          <Slider
            id="hours"
            className="mt-3 max-w-md"
            value={[hours]}
            min={WEEKLY_HOURS.min}
            max={WEEKLY_HOURS.max}
            step={WEEKLY_HOURS.step}
            onValueChange={([value]) => setHours(value ?? WEEKLY_HOURS.default)}
          />
          <Button
            className="mt-4"
            disabled={busy || hours === state.profile.weekly_hours}
            onClick={() =>
              send({ type: 'weekly_hours', weekly_hours: hours }, 'Weekly hours saved')
            }
          >
            Save and replan
          </Button>
        </div>
      </Panel>
    </div>
  );
}
