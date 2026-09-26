import { z } from 'zod';

/**
 * What the model is allowed to return. Resources are URLs only: they are matched
 * against the whitelist afterwards, so an invented link cannot reach a student.
 */
export const planItemSchema = z.object({
  week: z.number().int().min(1).max(16),
  skill: z.string().min(1),
  title: z.string().min(4).max(120),
  why: z.string().min(20).max(600),
  est_hours: z.number().int().min(1).max(24),
  resource_urls: z.array(z.string()).max(4).default([]),
  proof_project: z
    .object({
      title: z.string().min(4).max(120),
      description: z.string().min(10).max(600),
      skills_covered: z.array(z.string()).min(1).max(3),
      acceptance_criteria: z.array(z.string()).min(3).max(5),
    })
    .nullable()
    .default(null),
});

export const planSchema = z.object({ items: z.array(planItemSchema).min(1).max(24) });

export type PlanItemDraft = z.infer<typeof planItemSchema>;
export type PlanDraft = z.infer<typeof planSchema>;
