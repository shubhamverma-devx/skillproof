import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Tab = 'dashboard' | 'roadmap' | 'progress';

const TABS: Array<{ id: Tab; label: string; href: (id: string) => string }> = [
  { id: 'dashboard', label: 'Dashboard', href: (id) => `/dashboard/${id}` },
  { id: 'roadmap', label: 'Roadmap', href: (id) => `/roadmap/${id}` },
  { id: 'progress', label: 'Log progress', href: (id) => `/progress/${id}` },
];

export function ProfileNav({ profileId, active }: { profileId: string; active: Tab }) {
  return (
    <nav className="flex gap-1" aria-label="Profile sections">
      {TABS.map((tab) => (
        <Button
          key={tab.id}
          asChild
          size="sm"
          variant={tab.id === active ? 'primary' : 'ghost'}
        >
          <Link href={tab.href(profileId)} aria-current={tab.id === active ? 'page' : undefined}>
            {tab.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
