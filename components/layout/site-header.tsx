import Link from 'next/link';
import { ProofSeal } from '@/components/ui/proof-seal';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b bg-surface">
      <div className="mx-auto flex max-w-shell flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2 font-display text-ui font-semibold">
          <ProofSeal className="text-primary" size={22} />
          SkillProof
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
