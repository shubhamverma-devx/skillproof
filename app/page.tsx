import { FileText, FolderGit2, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { DemoProfileButton } from '@/components/landing/demo-button';
import { ProductFrame } from '@/components/landing/product-frame';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { ProofSeal } from '@/components/ui/proof-seal';
import { getTaxonomy, listRoles } from '@/lib/dataset';
import { isSarvamPrimary } from '@/lib/llm';
import { PROOF_LABEL } from '@/lib/wording';

const HOW = [
  {
    title: 'Tell us the job you want',
    body: 'Pick a role and how many hours a week you have. Paste your resume and add your GitHub username.',
  },
  {
    title: 'We check what you can prove',
    body: 'We read your resume, look through your public projects, and compare both against what real job posts ask for.',
  },
  {
    title: 'You get a plan you can act on',
    body: 'A week by week plan sized to your hours, where every task ends in something you can show a recruiter.',
  },
];

const PROOF = [
  {
    icon: FileText,
    label: PROOF_LABEL.claimed,
    body: 'Your resume says you know it. That is a claim, and we treat it as one.',
    tone: 'text-claimed',
  },
  {
    icon: FolderGit2,
    label: PROOF_LABEL.observed,
    body: 'We found it in your public code, and we can name the file it came from.',
    tone: 'text-observed',
  },
  {
    icon: ListChecks,
    label: PROOF_LABEL.verified,
    body: 'You answered four questions on it and got them right. That is proof.',
    tone: 'text-verified',
  },
];

const FAQ = [
  {
    q: 'Is it free?',
    a: 'Yes. There is no account, no password and nothing to pay. You can close the tab and come back with the link.',
  },
  {
    q: 'Where does the job data come from?',
    a: 'A hand collected sample of about twenty entry level listings per role from public Indian job boards. Five full job posts per role ship inside the repository so you can read them yourself. It is a sample, not a census, and we say so.',
  },
  {
    q: 'What do you do with my resume?',
    a: 'It is stored against your profile so the page can be reloaded, and it is read to find skill names. We only ever read public GitHub repositories, never private ones.',
  },
  {
    q: 'How accurate is the score?',
    a: 'The maths is fixed and the same for everyone: how often a skill is asked for, multiplied by how well you can prove it. Every number on screen can be traced back to a file in your code or a line in the dataset.',
  },
];

export default function LandingPage() {
  const roles = listRoles();
  const totalJds = roles.reduce((sum, role) => sum + role.jd_count, 0);
  const skillCount = getTaxonomy().skills.length;

  return (
    <>
      <header className="border-b bg-surface">
        <div className="mx-auto flex max-w-content items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold">
            <ProofSeal className="text-accent" size={20} />
            SkillProof
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/start">Check my readiness</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-content px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div>
              <h1 className="max-w-xl text-2xl sm:text-[2.5rem] sm:leading-[1.1]">
                Know exactly what stands between you and your first tech job.
              </h1>
              <p className="mt-4 max-w-prose text-base text-ink-muted">
                SkillProof reads your resume and your code, works out which skills you can actually
                prove, and turns the difference into a week by week plan.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/start">Check my readiness</Link>
                </Button>
                <DemoProfileButton />
              </div>
              <p className="tabular mt-4 text-sm text-ink-faint">
                Free, no account. {roles.length} roles, {totalJds} job posts, {skillCount} skills.
              </p>
            </div>

            <ProductFrame />
          </div>
        </section>

        <section className="border-t bg-surface">
          <div className="mx-auto max-w-content px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-xl">How it works</h2>
            <ol className="mt-6 grid gap-6 sm:grid-cols-3">
              {HOW.map((item, index) => (
                <li key={item.title}>
                  <span className="tabular font-mono text-sm text-ink-faint">0{index + 1}</span>
                  <h3 className="mt-1.5 text-base font-medium">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-content px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-xl">Three kinds of proof</h2>
          <p className="mt-1.5 max-w-prose text-sm text-ink-muted">
            Every skill sits in one of these. The whole product is about moving skills down this
            list.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {PROOF.map(({ icon: Icon, label, body, tone }) => (
              <div key={label} className="rounded-panel border bg-surface px-5 py-5">
                <Icon size={18} className={tone} aria-hidden="true" />
                <h3 className="mt-3 text-base font-medium">{label}</h3>
                <p className="mt-1 text-sm text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-surface">
          <div className="mx-auto max-w-content px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-xl">Questions you probably have</h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <dt className="text-base font-medium">{item.q}</dt>
                  <dd className="mt-1 max-w-prose text-sm text-ink-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-content flex-col gap-1 px-4 py-8 text-sm text-ink-faint sm:px-6 lg:px-8">
          <p>
            Built for Bit N Build 2026, problem statement 05: education and employability. The job
            post data is a hand collected sample, described in the README.
          </p>
          {isSarvamPrimary() ? <p>AI by Sarvam, with Groq and Gemini as backups.</p> : null}
        </div>
      </footer>
    </>
  );
}
