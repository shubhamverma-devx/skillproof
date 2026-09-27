import type { Metadata } from 'next';
import Link from 'next/link';
import { AnalysisStream } from '@/components/analyze/analysis-stream';
import { DemoNotice } from '@/components/layout/demo-notice';
import { ProofSeal } from '@/components/ui/proof-seal';
import { getStore } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Checking your profile | SkillProof' };

export default async function AnalyzePage({ params }: { params: { id: string } }) {
  // This screen says it is reading a resume and scanning repositories. On the
  // sample student none of that is a live call, so it has to say so here too
  // rather than only once the dashboard loads.
  const profile = await getStore().getProfile(params.id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6">
      <Link href="/" className="mb-8 flex items-center gap-2 text-base font-semibold">
        <ProofSeal className="text-accent" size={20} />
        SkillProof
      </Link>

      <h1 className="text-2xl">Checking what you can prove</h1>
      <p className="mt-1.5 max-w-prose text-sm text-ink-muted">
        This takes about fifteen seconds. We read what you gave us, look through your public
        projects, and compare both against real job posts.
      </p>

      {profile?.is_demo ? <DemoNotice className="mt-6" /> : null}

      <div className="mt-6">
        <AnalysisStream profileId={params.id} />
      </div>
    </main>
  );
}
