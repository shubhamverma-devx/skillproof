'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { postJson } from '@/lib/client/api';

export function DemoProfileButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function loadDemo() {
    setLoading(true);
    const result = await postJson<{ id: string }>('/api/profile', { demo: true });
    if ('error' in result) {
      setLoading(false);
      toast.error(result.error);
      return;
    }
    router.push(`/analyze/${result.data.id}`);
  }

  return (
    <Button variant="outline" size="lg" onClick={loadDemo} disabled={loading}>
      {loading ? 'Loading demo profile' : 'Load demo profile'}
    </Button>
  );
}
