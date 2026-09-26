import { z } from 'zod';
import { generateJson, hashText, makeCacheKey } from '@/lib/llm';
import { findSkillsInText, normaliseSkillName } from '@/lib/skills/taxonomy';
import type { Tracer } from './trace';

const resumeExtractionSchema = z.object({
  skills: z
    .array(
      z.object({
        name: z.string().min(1),
        context: z.string().default(''),
      }),
    )
    .max(60),
  projects: z
    .array(z.object({ title: z.string().min(1), description: z.string().default('') }))
    .max(12),
  education: z.string().default(''),
  experience: z.string().default(''),
});

export type ResumeExtraction = z.infer<typeof resumeExtractionSchema>;

export type ResumeIngestResult = {
  /** Canonical skill name to the resume line that claimed it. */
  claimed: Map<string, string>;
  extraction: ResumeExtraction;
  source: 'model' | 'keywords';
};

const SYSTEM_PROMPT = [
  'You extract structured facts from a student resume.',
  'Return JSON only, with keys: skills, projects, education, experience.',
  'skills is an array of { name, context } where context quotes the phrase in the resume that mentions the skill.',
  'Only include skills the resume actually mentions. Never add skills you think the student should have.',
  'projects is an array of { title, description }. education and experience are short plain strings.',
].join(' ');

/**
 * Turns resume text into claimed skills. The deterministic keyword pass decides
 * what counts as claimed; the model adds the quoted context, projects and
 * education that keyword matching cannot produce.
 */
export async function ingestResume(
  resumeText: string,
  tracer: Tracer,
  isDemo = false,
): Promise<ResumeIngestResult> {
  const keywordSkills = findSkillsInText(resumeText);
  await tracer.info(
    'Resume parsed',
    `${resumeText.split(/\s+/).length} words, ${keywordSkills.length} known skills matched by name`,
  );

  const { value, source } = await generateJson({
    schema: resumeExtractionSchema,
    system: SYSTEM_PROMPT,
    user: `Resume text:\n\n${resumeText.slice(0, 12_000)}`,
    cacheKey: makeCacheKey(isDemo, ['resume'], hashText(resumeText)),
    logger: tracer,
    fallback: () => keywordFallback(resumeText, keywordSkills),
  });

  const claimed = new Map<string, string>();
  for (const skill of keywordSkills) {
    claimed.set(skill, `Listed on the resume`);
  }
  for (const entry of value.skills) {
    const canonical = normaliseSkillName(entry.name);
    if (!canonical) continue;
    const context = entry.context.trim();
    claimed.set(canonical, context.length > 0 ? context : 'Listed on the resume');
  }

  await tracer.info(
    'Claimed skills recorded',
    `${claimed.size} skills claimed on the resume: ${[...claimed.keys()].slice(0, 8).join(', ')}`,
  );

  return { claimed, extraction: value, source: source === 'fallback' ? 'keywords' : 'model' };
}

function keywordFallback(resumeText: string, keywordSkills: string[]): ResumeExtraction {
  return {
    skills: keywordSkills.map((name) => ({
      name,
      context: findMentionLine(resumeText, name) ?? 'Listed on the resume',
    })),
    projects: [],
    education: '',
    experience: '',
  };
}

function findMentionLine(text: string, skill: string): string | null {
  const needle = skill.toLowerCase();
  const line = text
    .split('\n')
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate.toLowerCase().includes(needle));
  return line && line.length > 0 ? line.slice(0, 160) : null;
}
