import { z } from 'zod';
import { WEEKLY_HOURS } from '@/lib/config';
import { getStore } from '@/lib/db';
import { getDemoSeed } from '@/lib/demo';
import { extractPdfText, ResumeParseError } from '@/lib/resume/pdf';
import { isRoleSlug } from '@/types/data';
import type { Profile } from '@/types/domain';

const MIN_RESUME_CHARS = 80;

export const createProfileSchema = z.object({
  name: z.string().trim().min(1, 'Add your name').max(80),
  target_role: z.string().refine(isRoleSlug, 'Pick one of the listed roles'),
  weekly_hours: z.coerce
    .number()
    .int()
    .min(WEEKLY_HOURS.min, `At least ${WEEKLY_HOURS.min} hours a week`)
    .max(WEEKLY_HOURS.max, `At most ${WEEKLY_HOURS.max} hours a week`),
  resume_text: z.string().default(''),
  github_username: z
    .string()
    .trim()
    .max(64)
    .regex(/^[A-Za-z0-9-]*$/, 'GitHub usernames use letters, numbers and hyphens only')
    .transform((value) => (value.length > 0 ? value : null))
    .nullable()
    .default(null),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

/**
 * Builds a profile from the onboarding form. The resume can arrive as a PDF or as
 * pasted text; an unreadable PDF is reported as a parse error so the form can ask
 * for text instead of failing silently.
 */
export async function createProfile(form: FormData): Promise<Profile> {
  const input = createProfileSchema.parse({
    name: form.get('name') ?? '',
    target_role: form.get('target_role') ?? '',
    weekly_hours: form.get('weekly_hours') ?? WEEKLY_HOURS.default,
    resume_text: form.get('resume_text') ?? '',
    github_username: form.get('github_username') ?? '',
  });

  const file = form.get('resume_file');
  let resumeText = input.resume_text.trim();

  if (file instanceof File && file.size > 0) {
    const fromPdf = await extractPdfText(Buffer.from(await file.arrayBuffer()));
    resumeText = resumeText.length > 0 ? `${resumeText}\n\n${fromPdf}` : fromPdf;
  }

  if (resumeText.length < MIN_RESUME_CHARS) {
    throw new ResumeParseError(
      'Add your resume as text or upload a readable PDF so we have something to analyse.',
    );
  }

  return getStore().createProfile({
    name: input.name,
    target_role: input.target_role,
    weekly_hours: input.weekly_hours,
    resume_text: resumeText,
    github_username: input.github_username,
    github_summary: null,
    is_demo: false,
  });
}

/** Seeds the demo student so the landing page can open a working dashboard. */
export async function createDemoProfile(): Promise<Profile> {
  const seed = getDemoSeed();
  return getStore().createProfile({
    name: seed.name,
    target_role: seed.target_role,
    weekly_hours: seed.weekly_hours,
    resume_text: seed.resume_text,
    github_username: seed.github_username,
    github_summary: null,
    is_demo: true,
  });
}
