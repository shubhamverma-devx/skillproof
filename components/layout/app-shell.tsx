import Link from 'next/link';
import { DemoNotice } from '@/components/layout/demo-notice';
import { ProofSeal } from '@/components/ui/proof-seal';
import { ThemeToggle } from './theme-toggle';
import { SECTIONS, type SectionId } from './nav-sections';
import { cn } from '@/lib/utils';

type ShellProps = {
  profileId: string;
  active: SectionId;
  studentName: string;
  roleName: string;
  isDemo: boolean;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * The frame every signed in page lives in: a sidebar on desktop and a bottom tab
 * bar on a phone, so no page has to carry its own navigation and no page can
 * become a single unbroken scroll.
 */
export function AppShell({
  profileId,
  active,
  studentName,
  roleName,
  isDemo,
  title,
  subtitle,
  actions,
  children,
}: ShellProps) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        profileId={profileId}
        active={active}
        studentName={studentName}
        roleName={roleName}
      />

      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <MobileBar title={title} />

        <main className="mx-auto w-full max-w-content px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="hidden text-xl lg:block">{title}</h1>
              <p className="max-w-prose text-sm text-ink-muted lg:mt-1">{subtitle}</p>
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
          </div>

          {isDemo ? <DemoNotice className="mt-5" /> : null}

          <div className="mt-6">{children}</div>
        </main>
      </div>

      <BottomTabs profileId={profileId} active={active} />
    </div>
  );
}

function Sidebar({
  profileId,
  active,
  studentName,
  roleName,
}: Pick<ShellProps, 'profileId' | 'active' | 'studentName' | 'roleName'>) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-surface lg:flex">
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-5 text-base font-semibold tracking-tight"
      >
        <ProofSeal className="text-accent" size={20} />
        SkillProof
      </Link>

      <nav className="flex flex-col gap-0.5 px-3" aria-label="Sections">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const current = section.id === active;
          return (
            <Link
              key={section.id}
              href={section.href(profileId)}
              aria-current={current ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-control px-3 py-2 text-sm transition-colors',
                current
                  ? 'bg-ink/[0.06] font-medium text-ink'
                  : 'text-ink-muted hover:bg-ink/[0.04] hover:text-ink',
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {section.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{studentName}</p>
            <p className="truncate text-xs text-ink-faint">{roleName}</p>
          </div>
          <ThemeToggle className="-mr-2 shrink-0" />
        </div>
      </div>
    </aside>
  );
}

function MobileBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
      <h1 className="truncate text-base font-semibold">{title}</h1>
      <ThemeToggle className="-mr-2 shrink-0" />
    </header>
  );
}

function BottomTabs({ profileId, active }: Pick<ShellProps, 'profileId' | 'active'>) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-surface/95 backdrop-blur lg:hidden"
      aria-label="Sections"
    >
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const current = section.id === active;
        return (
          <Link
            key={section.id}
            href={section.href(profileId)}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-2.5 text-xs transition-colors',
              current ? 'text-accent' : 'text-ink-faint hover:text-ink',
            )}
          >
            <Icon size={18} aria-hidden="true" />
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
