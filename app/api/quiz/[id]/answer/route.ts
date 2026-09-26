import { z } from 'zod';
import { failFromError, ok } from '@/lib/api-response';
import { answerQuiz } from '@/lib/services/quiz-service';

export const dynamic = 'force-dynamic';
// The model SDKs, the Supabase client and the resume parser all need Node APIs.
export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  attempt_id: z.string().min(1),
  answer_index: z.number().int().min(0).max(3),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json());
    return ok(await answerQuiz(params.id, body.attempt_id, body.answer_index));
  } catch (error) {
    return failFromError(error);
  }
}
