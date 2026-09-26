import type { NextRequest } from 'next/server';
import { failFromError, ok } from '@/lib/api-response';
import { createDemoProfile, createProfile } from '@/lib/services/profile-service';
import { ResumeParseError } from '@/lib/resume/pdf';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const body: unknown = await request.json();
      const wantsDemo =
        typeof body === 'object' && body !== null && (body as { demo?: unknown }).demo === true;
      if (!wantsDemo)
        return failFromError(new Error('Send the onboarding form as form data.'), 400);
      const profile = await createDemoProfile();
      return ok({ id: profile.id, demo: true }, { status: 201 });
    }

    const profile = await createProfile(await request.formData());
    return ok({ id: profile.id, demo: false }, { status: 201 });
  } catch (error) {
    if (error instanceof ResumeParseError) return failFromError(error, 422);
    return failFromError(error);
  }
}
