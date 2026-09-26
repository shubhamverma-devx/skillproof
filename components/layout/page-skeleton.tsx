import { PageShell } from '@/components/layout/page-shell';
import { SiteHeader } from '@/components/layout/site-header';
import { Panel } from '@/components/ui/panel';
import { Skeleton } from '@/components/ui/skeleton';

/** Shown while a profile page loads its state on the server. */
export function PageSkeleton({ columns = 1 }: { columns?: 1 | 2 }) {
  return (
    <>
      <SiteHeader />
      <PageShell>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-80" />
        <div
          className={
            columns === 2 ? 'mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]' : 'mt-6 grid gap-4'
          }
        >
          <div className="flex flex-col gap-4">
            <Panel className="px-5 py-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-3 h-14 w-full" />
            </Panel>
            <Panel className="px-5 py-6">
              <Skeleton className="h-4 w-52" />
              <div className="mt-4 space-y-3">
                {[0, 1, 2, 3, 4].map((row) => (
                  <Skeleton key={row} className="h-6 w-full" />
                ))}
              </div>
            </Panel>
          </div>
          {columns === 2 ? (
            <div className="flex flex-col gap-4">
              <Panel className="px-5 py-6">
                <Skeleton className="h-40 w-full" />
              </Panel>
              <Panel className="px-5 py-6">
                <Skeleton className="h-28 w-full" />
              </Panel>
            </div>
          ) : null}
        </div>
      </PageShell>
    </>
  );
}
