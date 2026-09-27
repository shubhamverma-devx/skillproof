import { cn } from '@/lib/utils';

/** Every empty view says what is missing and what to do about it. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-5 py-10 text-center', className)}>
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-prose text-sm text-ink-muted">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
