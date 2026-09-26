import { FileSearch, GitBranch, Route } from 'lucide-react';
import Link from 'next/link';
import { DemoProfileButton } from '@/components/landing/demo-button';
import { SiteHeader } from '@/components/layout/site-header';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { getTaxonomy, listRoles } from '@/lib/dataset';
import { isDemoModeForced } from '@/lib/demo';

const FEATURES = [
  {
    Icon: FileSearch,
    title: 'Evidence, not self assessment',
    body: 'Every skill is marked claimed from your resume, observed in your GitHub code, or verified by a short adaptive quiz. The badge tells you which.',
  },
  {
    Icon: GitBranch,
    title: 'A score you can argue with',
    body: 'Readiness is weighted by how often each skill appears in real job descriptions for your target role, and every number links back to the file or line that produced it.',
  },
  {
    Icon: Route,
    title: 'A roadmap that answers why',
    body: 'Each week has a reason, an hour budget you set, and a proof project that turns the gap into something you can show a recruiter.',
  },
];

export default function LandingPage() {
  const roles = listRoles();
  const totalJds = roles.reduce((sum, role) => sum + role.jd_count, 0);
  const skillCount = getTaxonomy().skills.length;

  return (
    <>
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-shell px-4 pb-10 pt-12 sm:px-6 lg:px-10 lg:pb-16 lg:pt-20">
          <p className="tabular text-ui-sm text-muted">
            {roles.length} roles, {totalJds} job descriptions, {skillCount} skills in the taxonomy
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-h1 font-bold lg:text-display">
            Skills proven, not claimed
          </h1>
          <p className="mt-4 max-w-prose text-ui text-muted">
            Most students know the role they want. SkillProof works out which skills they can actually
            prove, which ones the market asks for, and what to build next. It reads your resume, reads
            your code, asks you four questions per skill, and turns the difference into a week by week
            plan you approve.
          </p>
          {isDemoModeForced() ? (
            <p className="mt-5 max-w-prose rounded-inner border border-claimed/40 bg-claimed/[0.08] px-4 py-2 text-ui-sm">
              DEMO_MODE is on. Model replies are served from the recorded cache in data/demo and
              written back to it, so this deployment is set up for the demo rather than for live
              analysis.
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/start">Analyse my profile</Link>
            </Button>
            <DemoProfileButton />
          </div>
        </section>

        <section className="mx-auto max-w-shell px-4 pb-12 sm:px-6 lg:px-10">
          <Panel className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="px-5 py-6">
                <Icon size={20} className="text-primary" aria-hidden="true" />
                <h2 className="mt-3 text-h3">{title}</h2>
                <p className="mt-2 text-ui-sm text-muted">{body}</p>
              </div>
            ))}
          </Panel>
        </section>

        <section className="mx-auto max-w-shell px-4 pb-16 sm:px-6 lg:px-10">
          <h2 className="text-h3">Roles in the dataset</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <li key={role.slug} className="rounded-inner border bg-surface px-4 py-3">
                <p className="font-medium">{role.role}</p>
                <p className="tabular mt-0.5 text-ui-sm text-muted">
                  {role.skill_count} skills from {role.jd_count} listings
                </p>
                <p className="mt-1 text-ui-sm text-muted">{role.top_skills.join(', ')}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-shell px-4 py-6 text-ui-sm text-muted sm:px-6 lg:px-10">
          Built for Bit N Build 2026, problem statement 05: education and employability. The job
          description dataset is a curated sample, described in the README.
        </div>
      </footer>
    </>
  );
}
