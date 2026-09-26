'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FieldHint, Input, Label, Textarea } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import { Slider } from '@/components/ui/slider';
import { WEEKLY_HOURS } from '@/lib/config';
import { postForm } from '@/lib/client/api';
import type { RoleSummary } from '@/lib/dataset';
import { StepHeader } from './step-header';

const STEPS = ['Target role', 'Time you have', 'Your evidence'] as const;

export function OnboardingForm({ roles }: { roles: RoleSummary[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string>('');
  const [hours, setHours] = useState<number>(WEEKLY_HOURS.default);
  const [name, setName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [github, setGithub] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canContinue = step === 0 ? role !== '' : step === 1 ? name.trim().length > 0 : true;

  async function submit() {
    if (resumeText.trim().length === 0 && !resumeFile) {
      toast.error('Paste your resume text or upload a PDF so we have something to read.');
      return;
    }

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
      <StepHeader steps={STEPS} current={step} />

      <div className="px-5 py-6">
        {step === 0 ? (
          <fieldset>
            <legend className="text-h3">Which role are you preparing for?</legend>
            <FieldHint className="mt-1">
              Skill demand is measured separately for each role, so this choice decides every number
              that follows.
            </FieldHint>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {roles.map((option) => (
                <label
                  key={option.slug}
                  className={`cursor-pointer rounded-inner border px-4 py-3 ${
                    role === option.slug ? 'border-primary bg-primary/[0.06]' : 'bg-surface'
                  }`}
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
                  <span className="tabular mt-0.5 block text-ui-sm text-muted">
                    {option.skill_count} skills from {option.jd_count} listings
                  </span>
                  <span className="mt-1 block text-ui-sm text-muted">
                    {option.top_skills.join(', ')}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="max-w-prose">
            <h2 className="text-h3">How much time do you have each week?</h2>
            <FieldHint className="mt-1">
              The roadmap never plans more hours in a week than you pick here.
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
                aria-label="Hours available each week"
              />
              <div className="tabular mt-1 flex justify-between text-ui-sm text-muted">
                <span>{WEEKLY_HOURS.min}</span>
                <span>{WEEKLY_HOURS.max}</span>
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="name">Your name</Label>
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
            <h2 className="text-h3">Give us something to read</h2>
            <FieldHint className="mt-1">
              Resume text becomes claimed evidence. GitHub code becomes observed evidence. Both are
              optional on their own, but you need at least a resume.
            </FieldHint>

            <div className="mt-5">
              <Label htmlFor="resume-text">Paste your resume text</Label>
              <Textarea
                id="resume-text"
                className="mt-2"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                placeholder="Skills, projects, coursework. Plain text is fine."
              />
            </div>

            <div className="mt-5">
              <Label htmlFor="resume-file">Or upload a PDF</Label>
              <Input
                id="resume-file"
                type="file"
                accept="application/pdf"
                className="mt-2 py-1.5 file:mr-3 file:rounded-inner file:border-0 file:bg-ink/[0.06] file:px-3 file:py-1.5 file:text-ui-sm"
                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              />
              <FieldHint className="mt-1">
                Scanned PDFs have no readable text. If the upload fails, paste the text instead.
              </FieldHint>
            </div>

            <div className="mt-5">
              <Label htmlFor="github">GitHub username (optional)</Label>
              <Input
                id="github"
                className="mt-2"
                value={github}
                onChange={(event) => setGithub(event.target.value)}
                placeholder="your-github-handle"
                autoComplete="off"
              />
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
        {step < 2 ? (
          <Button onClick={() => setStep((value) => value + 1)} disabled={!canContinue}>
            Continue
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Starting analysis' : 'Analyse my profile'}
          </Button>
        )}
      </div>
    </Panel>
  );
}
