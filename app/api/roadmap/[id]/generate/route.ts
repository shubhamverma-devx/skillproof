import { failFromError, ok } from '@/lib/api-response';
import { generateRoadmap } from '@/lib/services/roadmap-service';

export const dynamic = 'force-dynamic';
// The model SDKs, the Supabase client and the resume parser all need Node APIs.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    return ok(await generateRoadmap(params.id));
  } catch (error) {
    return failFromError(error);
  }
}
