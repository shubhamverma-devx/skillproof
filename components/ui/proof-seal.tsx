import { cn } from '@/lib/utils';

/**
 * The product mark: a ring with a check, used as the logo and as the small seal
 * on any skill that has been verified by a quiz.
 */
export function ProofSeal({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6.25" stroke="currentColor" strokeWidth="0.75" opacity="0.45" />
      <path
        d="M8.5 12.2 11 14.6l4.6-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
