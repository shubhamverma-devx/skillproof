'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/** A failure inside a server component would otherwise be a blank screen. */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('page failed', error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 sm:px-6">
      <h1 className="text-2xl">Something broke on this page</h1>
      <p className="mt-2 max-w-prose text-sm text-ink-muted">
        {error.message || 'We could not render this page.'} Your profile and everything in it is
        safe.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" asChild>
          <a href="/">Back to the home page</a>
        </Button>
      </div>
    </main>
  );
}
