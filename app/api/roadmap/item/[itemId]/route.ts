import { failFromError, ok } from '@/lib/api-response';
import { itemPatchSchema, updateRoadmapItem } from '@/lib/services/roadmap-service';

export const dynamic = 'force-dynamic';
// The model SDKs, the Supabase client and the resume parser all need Node APIs.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function PATCH(request: Request, { params }: { params: { itemId: string } }) {
  try {
    const patch = itemPatchSchema.parse(await request.json());
    return ok(await updateRoadmapItem(params.itemId, patch));
  } catch (error) {
    return failFromError(error);
  }
}
