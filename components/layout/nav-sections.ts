import { ClipboardList, LayoutDashboard, ListChecks, Route } from 'lucide-react';

export type SectionId = 'overview' | 'skills' | 'roadmap' | 'progress';

export const SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    href: (id: string) => `/dashboard/${id}`,
  },
  { id: 'skills', label: 'Skills', icon: ListChecks, href: (id: string) => `/skills/${id}` },
  { id: 'roadmap', label: 'Roadmap', icon: Route, href: (id: string) => `/roadmap/${id}` },
  {
    id: 'progress',
    label: 'Progress',
    icon: ClipboardList,
    href: (id: string) => `/progress/${id}`,
  },
] as const satisfies ReadonlyArray<{
  id: SectionId;
  label: string;
  icon: typeof LayoutDashboard;
  href: (id: string) => string;
}>;
