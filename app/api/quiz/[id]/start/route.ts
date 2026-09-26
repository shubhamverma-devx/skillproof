import { z } from 'zod';
import { failFromError, ok } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';
import { startQuiz } from '@/lib/services/quiz-service';

export const dynamic = 'force-dynamic';
// The model SDKs, the Supabase client and the resume parser all need Node APIs.
export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({ skill: z.string().min(1) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const limited = await rateLimit('quiz', request);
  if (limited) return limited;

  try {
    const { skill } = bodySchema.parse(await request.json());
    return ok(await startQuiz(params.id, skill));
  } catch (error) {
    return failFromError(error);
  }
}
