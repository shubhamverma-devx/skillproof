import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <PageShell>
        <div className="mx-auto max-w-prose py-16">
          <h1 className="text-h2">We could not find that profile</h1>
          <p className="mt-2 text-ui-sm text-muted">
            Profiles live at their own address and are not listed anywhere. If you lost the link,
            start a new analysis or open the demo profile.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/start">Start a new analysis</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to the home page</Link>
            </Button>
          </div>
        </div>
      </PageShell>
    </>
  );
}
