import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/site-header';
import { PageShell } from '@/components/layout/page-shell';
import { OnboardingForm } from '@/components/start/onboarding-form';
import { listRoles } from '@/lib/dataset';

export const metadata: Metadata = { title: 'Start | SkillProof' };

export default function StartPage() {
  return (
    <>
      <SiteHeader />
      <PageShell>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-h2">Set up your analysis</h1>
          <p className="mt-1 max-w-prose text-ui-sm text-muted">
            Three short steps. Nothing is stored beyond this profile, and there is no account to
            create.
          </p>
          <div className="mt-6">
            <OnboardingForm roles={listRoles()} />
          </div>
        </div>
      </PageShell>
    </>
  );
}
