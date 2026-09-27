import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProofSeal } from '@/components/ui/proof-seal';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2 text-base font-semibold">
        <ProofSeal className="text-accent" size={20} />
        SkillProof
      </Link>
      <h1 className="mt-8 text-2xl">We could not find that page</h1>
      <p className="mt-2 max-w-prose text-sm text-ink-muted">
        Profiles live at their own address and are not listed anywhere. If you lost the link, start
        again or open the sample student.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/start">Check my readiness</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back to the home page</Link>
        </Button>
      </div>
    </main>
  );
}
