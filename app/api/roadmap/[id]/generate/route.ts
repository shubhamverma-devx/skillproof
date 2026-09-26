import { failFromError, ok } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';
import { generateRoadmap } from '@/lib/services/roadmap-service';

export const dynamic = 'force-dynamic';
// The model SDKs, the Supabase client and the resume parser all need Node APIs.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const limited = await rateLimit('roadmap', request);
  if (limited) return limited;

  try {
    return ok(await generateRoadmap(params.id));
  } catch (error) {
    return failFromError(error);
  }
}
