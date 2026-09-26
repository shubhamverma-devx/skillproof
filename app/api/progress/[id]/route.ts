import { z } from 'zod';
import { failFromError, ok } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';
import { WEEKLY_HOURS } from '@/lib/config';
import { recordProgress } from '@/lib/services/progress-service';

export const dynamic = 'force-dynamic';
// The model SDKs, the Supabase client and the resume parser all need Node APIs.
export const runtime = 'nodejs';
export const maxDuration = 60;

const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('item_status'),
    item_id: z.string().min(1),
    status: z.enum(['todo', 'doing', 'done', 'skipped']),
  }),
  z.object({ type: z.literal('repo'), repo: z.string().trim().min(3).max(200) }),
  z.object({
    type: z.literal('weekly_hours'),
    weekly_hours: z.number().int().min(WEEKLY_HOURS.min).max(WEEKLY_HOURS.max),
  }),
]);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const limited = await rateLimit('progress', request);
  if (limited) return limited;

  try {
    const event = eventSchema.parse(await request.json());
    return ok(await recordProgress(params.id, event));
  } catch (error) {
    return failFromError(error);
  }
}
