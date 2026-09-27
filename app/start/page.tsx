import type { Metadata } from 'next';
import Link from 'next/link';
import { OnboardingForm } from '@/components/start/onboarding-form';
import { ProofSeal } from '@/components/ui/proof-seal';
import { listRoles } from '@/lib/dataset';

export const metadata: Metadata = { title: 'Get started | SkillProof' };

export default function StartPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:py-16">
      <Link href="/" className="flex items-center gap-2 text-base font-semibold">
        <ProofSeal className="text-accent" size={20} />
        SkillProof
      </Link>

      <h1 className="mt-8 text-2xl">Let us see where you stand</h1>
      <p className="mt-1.5 max-w-prose text-sm text-ink-muted">
        Four short questions. There is no account and no password, and you can close this at any
        point.
      </p>

      <div className="mt-6">
        <OnboardingForm roles={listRoles()} />
      </div>
    </main>
  );
}
