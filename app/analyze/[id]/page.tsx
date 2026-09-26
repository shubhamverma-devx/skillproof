import type { Metadata } from 'next';
import { AnalysisStream } from '@/components/analyze/analysis-stream';
import { PageShell } from '@/components/layout/page-shell';
import { SiteHeader } from '@/components/layout/site-header';

export const metadata: Metadata = { title: 'Analysing | SkillProof' };

export default function AnalyzePage({ params }: { params: { id: string } }) {
  return (
    <>
      <SiteHeader />
      <PageShell>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-h2">Analysing your profile</h1>
          <p className="mt-1 max-w-prose text-ui-sm text-muted">
            Each line is a real step the agent took, including anything that failed and what it did
            instead.
          </p>
          <div className="mt-6">
            <AnalysisStream profileId={params.id} />
          </div>
        </div>
      </PageShell>
    </>
  );
}
