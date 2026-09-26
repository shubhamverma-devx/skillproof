import { AlertTriangle } from 'lucide-react';
import { getStorageStatus } from '@/lib/db';

/**
 * Serverless deployments have no durable filesystem, so running there without
 * Supabase credentials silently loses every profile between requests. That is
 * worth saying out loud rather than discovering during a demo.
 */
export function StorageWarning() {
  if (getStorageStatus() !== 'unconfigured') return null;

  return (
    <div className="border-b border-danger/30 bg-danger/[0.07]">
      <div className="mx-auto flex max-w-content items-start gap-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <p>
          <span className="font-medium">Storage is not configured.</span> This deployment has no
          database, so anything you create here will disappear on the next request. Set
          NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to fix it.
        </p>
      </div>
    </div>
  );
}
