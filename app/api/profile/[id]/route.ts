import { fail, failFromError, ok } from '@/lib/api-response';
import { loadProfileState } from '@/lib/agent/profile-state';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const state = await loadProfileState(params.id);
    if (!state) return fail('Profile not found', 404);
    return ok(state);
  } catch (error) {
    return failFromError(error);
  }
}
