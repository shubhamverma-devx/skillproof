'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Last line of defence: a failure inside a server component would otherwise show
 * a blank screen, which the graceful failure rules rule out.
 */
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
    <main className="mx-auto max-w-prose px-4 py-16">
      <h1 className="text-h2">Something broke on this page</h1>
      <p className="mt-2 text-ui-sm text-muted">
        {error.message || 'The page could not be rendered.'} Your profile and its data are safe.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/">Back to the home page</a>
        </Button>
      </div>
    </main>
  );
}
