'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

/**
 * Detail panel that slides in from the right. Details live here rather than
 * expanding inline, so opening one row never pushes the rest of the page around.
 */
export const SheetContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title: string;
    subtitle?: string;
  }
>(({ className, children, title, subtitle, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 animate-fade-in bg-ink/25 backdrop-blur-[1px]" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-full max-w-lg animate-sheet-in flex-col border-l bg-surface-raised shadow-overlay',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div className="min-w-0">
          <DialogPrimitive.Title className="text-lg">{title}</DialogPrimitive.Title>
          {subtitle ? (
            <DialogPrimitive.Description className="mt-0.5 text-sm text-ink-muted">
              {subtitle}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
        </div>
        <DialogPrimitive.Close className="rounded-control p-1.5 text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink">
          <X size={16} aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';
