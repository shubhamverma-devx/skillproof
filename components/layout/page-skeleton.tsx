import { Panel } from '@/components/ui/panel';
import { Skeleton } from '@/components/ui/skeleton';

/** Matches the real layout so nothing jumps when the content arrives. */
export function PageSkeleton() {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 border-r bg-surface p-5 lg:block">
        <Skeleton className="h-5 w-32" />
        <div className="mt-6 flex flex-col gap-2">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-8 w-full" />
          ))}
        </div>
      </aside>

      <div className="mx-auto w-full max-w-content px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />

        <div className="mt-6 flex flex-col gap-4">
          <Panel className="px-6 py-6">
            <Skeleton className="h-8 w-80 max-w-full" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
            <Skeleton className="mt-5 h-11 w-full" />
          </Panel>
          <Panel className="px-6 py-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-6 w-64 max-w-full" />
            <Skeleton className="mt-4 h-11 w-44" />
          </Panel>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-28 w-full rounded-panel" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
