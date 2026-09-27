'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  /** Names the draggable thumb, which is the element carrying role="slider". */
  label: string;
};

export const Slider = forwardRef<HTMLSpanElement, SliderProps>(
  ({ className, label, ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex h-6 w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-ink/10">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={label}
        className="block h-5 w-5 rounded-full border-2 border-accent bg-surface transition-shadow hover:shadow-overlay"
      />
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = 'Slider';
