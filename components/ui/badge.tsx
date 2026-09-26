import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-ink/[0.06] text-ink-muted',
        verified: 'bg-verified-soft/10 text-verified',
        observed: 'bg-observed-soft/10 text-observed',
        claimed: 'bg-claimed-soft/12 text-claimed',
        missing: 'bg-missing-soft/12 text-missing',
        accent: 'bg-accent/10 text-accent',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
