'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FieldHint, Input, Label, Textarea } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import { Slider } from '@/components/ui/slider';
import { postForm } from '@/lib/client/api';
import { WEEKLY_HOURS } from '@/lib/config';
import type { RoleSummary } from '@/lib/dataset';
import { cn } from '@/lib/utils';

const STEPS = ['Role', 'Time', 'Resume', 'GitHub'] as const;

const RESUME_EXAMPLE = `Skills: Python, pandas, SQL, Git
Projects: crop yield prediction with scikit-learn, Flask movie recommender
Coursework: databases, statistics, machine learning`;

export function OnboardingForm({ roles }: { roles: RoleSummary[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [hours, setHours] = useState<number>(WEEKLY_HOURS.default);
  const [name, setName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [github, setGithub] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canContinue =
    step === 0
      ? role !== ''
      : step === 1
        ? name.trim().length > 0
        : step === 2
          ? resumeText.trim().length > 0 || resumeFile !== null
          : true;

  async function submit() {
    setSubmitting(true);
    const form = new FormData();
    form.set('name', name.trim());
    form.set('target_role', role);
    form.set('weekly_hours', String(hours));
    form.set('resume_text', resumeText);
    form.set('github_username', github.trim());
    if (resumeFile) form.set('resume_file', resumeFile);

    const result = await postForm<{ id: string }>('/api/profile', form);
    if ('error' in result) {
      setSubmitting(false);
      toast.error(result.error);
      return;
    }
    router.push(`/analyze/${result.data.id}`);
  }

  return (
    <Panel>
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-2">
          {STEPS.map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs',
                  index < step && 'border-accent bg-accent text-accent-ink',
                  index === step && 'border-accent text-accent',
                  index > step && 'border-line text-ink-faint',
                )}
              >
                {index < step ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm sm:block',
                  index === step ? 'text-ink' : 'text-ink-faint',
                )}
              >
                {label}
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  className={cn('h-px flex-1', index < step ? 'bg-accent' : 'bg-line')}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ))}
        </div>
        <p className="tabular mt-3 text-xs text-ink-faint">
          Step {step + 1} of {STEPS.length}. Takes about a minute.
        </p>
      </div>

      <div className="px-5 py-6">
        {step === 0 ? (
          <fieldset>
            <legend className="text-lg">Which job are you aiming for?</legend>
            <FieldHint className="mt-1">
              Different jobs want different skills, so this decides everything we measure you
              against.
            </FieldHint>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {roles.map((option) => (
                <label
                  key={option.slug}
                  className={cn(
                    'cursor-pointer rounded-control border px-4 py-3 transition-colors',
                    role === option.slug ? 'border-accent bg-accent/[0.05]' : 'hover:bg-ink/[0.02]',
                  )}
                >
                  <input
                    type="radio"
                    name="target_role"
                    value={option.slug}
                    checked={role === option.slug}
                    onChange={() => setRole(option.slug)}
                    className="sr-only"
                  />
                  <span className="block font-medium">{option.role}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    {option.top_skills.slice(0, 3).join(', ')} and more
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="max-w-prose">
            <h2 className="text-lg">How much time do you have each week?</h2>
            <FieldHint className="mt-1">
              Be honest. We never plan a week that asks for more than this, so a small number gives
              you a plan you will actually finish.
            </FieldHint>

            <div className="mt-5">
              <Label htmlFor="weekly-hours">
                Hours a week: <span className="tabular font-semibold">{hours}</span>
              </Label>
              <Slider
                id="weekly-hours"
                className="mt-3"
                value={[hours]}
                min={WEEKLY_HOURS.min}
                max={WEEKLY_HOURS.max}
                step={WEEKLY_HOURS.step}
                onValueChange={([value]) => setHours(value ?? WEEKLY_HOURS.default)}
                label="Hours available each week"
              />
              <div className="tabular mt-1 flex justify-between text-xs text-ink-faint">
                <span>{WEEKLY_HOURS.min}</span>
                <span>{WEEKLY_HOURS.max}</span>
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="name">What should we call you?</Label>
              <Input
                id="name"
                className="mt-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Riya Sharma"
                autoComplete="name"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="max-w-prose">
            <h2 className="text-lg">Paste your resume</h2>
            <FieldHint className="mt-1">
              Anything you list here counts as something you say you know. We check it against your
              code later, so do not worry about making it perfect.
            </FieldHint>

            <div className="mt-5">
              <Label htmlFor="resume-text">Resume text</Label>
              <Textarea
                id="resume-text"
                className="mt-2"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                placeholder={RESUME_EXAMPLE}
              />
              <FieldHint className="mt-1.5">
                Skills, projects and coursework are the useful parts. Plain text is fine.
              </FieldHint>
            </div>

            <div className="mt-5">
              <Label htmlFor="resume-file">Or upload a PDF</Label>
              <Input
                id="resume-file"
                type="file"
                accept="application/pdf"
                className="mt-2 py-1.5 file:mr-3 file:rounded-control file:border-0 file:bg-ink/[0.06] file:px-3 file:py-1.5 file:text-sm"
                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              />
              <FieldHint className="mt-1.5">
                Scanned PDFs have no text inside them. If the upload fails, paste the text instead.
              </FieldHint>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="max-w-prose">
            <h2 className="text-lg">Your GitHub username</h2>
            <FieldHint className="mt-1">
              This is the part that makes the result worth having. We read your public code and find
              which file proves which skill, so your score is based on what you built rather than
              what you wrote down.
            </FieldHint>

            <div className="mt-5">
              <Label htmlFor="github">GitHub username</Label>
              <Input
                id="github"
                className="mt-2"
                value={github}
                onChange={(event) => setGithub(event.target.value)}
                placeholder="riya-sharma"
                autoComplete="off"
              />
              <FieldHint className="mt-1.5">
                Only public repositories, read only. You can skip this, but your score will be based
                on your resume alone.
              </FieldHint>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t px-5 py-4">
        <Button
          variant="ghost"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          disabled={step === 0 || submitting}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((value) => value + 1)} disabled={!canContinue}>
            Continue
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Starting' : 'Check my readiness'}
          </Button>
        )}
      </div>
    </Panel>
  );
}
