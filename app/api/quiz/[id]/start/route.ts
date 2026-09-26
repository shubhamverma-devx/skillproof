import { z } from 'zod';
import { failFromError, ok } from '@/lib/api-response';
import { startQuiz } from '@/lib/services/quiz-service';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ skill: z.string().min(1) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { skill } = bodySchema.parse(await request.json());
    return ok(await startQuiz(params.id, skill));
  } catch (error) {
    return failFromError(error);
  }
}
