import { z } from 'zod';
import { learningResourceSchema, skillCategorySchema } from './domain';

export const roleSkillSchema = z.object({
  skill: z.string(),
  frequency: z.number().min(0).max(1),
  category: skillCategorySchema,
});

export const roleStatsSchema = z.object({
  role: z.string(),
  jd_count: z.number().int().positive(),
  source_note: z.string(),
  skills: z.array(roleSkillSchema).min(1),
});

export const taxonomyEntrySchema = z.object({
  canonical: z.string(),
  category: skillCategorySchema,
  aliases: z.array(z.string()),
  hints: z.object({
    packages: z.array(z.string()).default([]),
    files: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
  }),
});

export const taxonomySchema = z.object({
  skills: z.array(taxonomyEntrySchema).min(1),
});

export const resourceMapSchema = z.record(z.string(), z.array(learningResourceSchema));

export type RoleSkill = z.infer<typeof roleSkillSchema>;
export type RoleStats = z.infer<typeof roleStatsSchema>;
export type TaxonomyEntry = z.infer<typeof taxonomyEntrySchema>;
export type Taxonomy = z.infer<typeof taxonomySchema>;

export const ROLE_SLUGS = [
  'ml-engineer',
  'frontend-developer',
  'backend-developer',
  'data-analyst',
  'devops-engineer',
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];

export function isRoleSlug(value: string): value is RoleSlug {
  return (ROLE_SLUGS as readonly string[]).includes(value);
}
