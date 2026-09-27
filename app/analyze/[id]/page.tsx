import type { Metadata } from 'next';
import Link from 'next/link';
import { AnalysisStream } from '@/components/analyze/analysis-stream';
import { ProofSeal } from '@/components/ui/proof-seal';

export const metadata: Metadata = { title: 'Checking your profile | SkillProof' };

export default function AnalyzePage({ params }: { params: { id: string } }) {
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

      <div className="mt-6">
        <AnalysisStream profileId={params.id} />
      </div>
    </main>
  );
}
