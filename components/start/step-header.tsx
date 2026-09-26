import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StepHeader({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number;
}) {
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2 border-b px-5 py-4">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            className={cn('flex items-center gap-2 text-ui-sm', active ? 'text-ink' : 'text-muted')}
            aria-current={active ? 'step' : undefined}
          >
            <span
              className={cn(
                'tabular flex h-6 w-6 items-center justify-center rounded-full border text-[0.8125rem]',
                done && 'border-primary bg-primary text-primary-ink',
                active && 'border-primary text-primary',
              )}
            >
              {done ? <Check size={13} aria-hidden="true" /> : index + 1}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
