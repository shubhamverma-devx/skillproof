import { cn } from '@/lib/utils';

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-panel border bg-surface', className)} {...props} />;
}

export function PanelHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn('flex flex-wrap items-center justify-between gap-3 px-5 py-4', className)}
      {...props}
    />
  );
}

export function PanelTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg', className)} {...props} />;
}

export function PanelNote({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('max-w-prose text-sm text-ink-muted', className)} {...props} />;
}
