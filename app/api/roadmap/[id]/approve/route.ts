import { failFromError, ok } from '@/lib/api-response';
import { approveRoadmap } from '@/lib/services/roadmap-service';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    return ok(await approveRoadmap(params.id));
  } catch (error) {
    return failFromError(error);
  }
}
