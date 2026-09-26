'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-inner font-medium transition-colors disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-ink hover:bg-primary/90',
        outline: 'border bg-surface text-ink hover:bg-ink/[0.04]',
        ghost: 'text-muted hover:bg-ink/[0.05] hover:text-ink',
        danger: 'border border-danger/30 bg-surface text-danger-ink hover:bg-danger/[0.08]',
      },
      size: {
        sm: 'h-8 px-3 text-ui-sm',
        md: 'h-10 px-4 text-ui-sm',
        lg: 'h-12 px-6 text-ui',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
