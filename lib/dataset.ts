import { z } from 'zod';
import dockerBank from '@/data/question_bank/docker.json';
import gitBank from '@/data/question_bank/git.json';
import javascriptBank from '@/data/question_bank/javascript.json';
import linuxBank from '@/data/question_bank/linux.json';
import machineLearningBank from '@/data/question_bank/machine-learning.json';
import pandasBank from '@/data/question_bank/pandas.json';
import pythonBank from '@/data/question_bank/python.json';
import reactBank from '@/data/question_bank/react.json';
import restApisBank from '@/data/question_bank/rest-apis.json';
import sqlBank from '@/data/question_bank/sql.json';
import proofProjectsJson from '@/data/proof_projects.json';
import resourcesJson from '@/data/resources.json';
import backendDeveloper from '@/data/roles/backend-developer.json';
import dataAnalyst from '@/data/roles/data-analyst.json';
import devopsEngineer from '@/data/roles/devops-engineer.json';
import frontendDeveloper from '@/data/roles/frontend-developer.json';
import mlEngineer from '@/data/roles/ml-engineer.json';
import skillTaxonomy from '@/data/skill_taxonomy.json';
import {
  resourceMapSchema,
  roleStatsSchema,
  taxonomySchema,
  ROLE_SLUGS,
  type RoleSlug,
  type RoleStats,
  type Taxonomy,
} from '@/types/data';
import { quizQuestionSchema, type LearningResource, type QuizQuestion } from '@/types/domain';

/**
 * Datasets are imported rather than read from disk so the bundler traces them
 * into the serverless output. Validation runs once per process and throws: a
 * malformed dataset is a build problem, not a runtime fallback case.
 */
const ROLE_JSON: Record<RoleSlug, unknown> = {
  'ml-engineer': mlEngineer,
  'frontend-developer': frontendDeveloper,
  'backend-developer': backendDeveloper,
  'data-analyst': dataAnalyst,
  'devops-engineer': devopsEngineer,
};

const QUESTION_BANK_JSON: Record<string, unknown> = {
  docker: dockerBank,
  git: gitBank,
  javascript: javascriptBank,
  linux: linuxBank,
  'machine-learning': machineLearningBank,
  pandas: pandasBank,
  python: pythonBank,
  react: reactBank,
  'rest-apis': restApisBank,
  sql: sqlBank,
};

const proofBlueprintSchema = z.object({
  title: z.string(),
  description: z.string(),
  acceptance_criteria: z.array(z.string()).min(3).max(5),
});

const proofBlueprintMapSchema = z.record(z.string(), proofBlueprintSchema);

export type ProofBlueprint = z.infer<typeof proofBlueprintSchema>;

const questionBankSchema = z.object({
  skill: z.string(),
  questions: z.array(quizQuestionSchema).min(1),
});

let taxonomyCache: Taxonomy | null = null;
let resourceCache: Record<string, LearningResource[]> | null = null;
const roleCache = new Map<RoleSlug, RoleStats>();

export function getTaxonomy(): Taxonomy {
  taxonomyCache ??= taxonomySchema.parse(skillTaxonomy);
  return taxonomyCache;
}

export function getRoleStats(slug: RoleSlug): RoleStats {
  const cached = roleCache.get(slug);
  if (cached) return cached;
  const parsed = roleStatsSchema.parse(ROLE_JSON[slug]);
  roleCache.set(slug, parsed);
  return parsed;
}

export type RoleSummary = {
  slug: RoleSlug;
  role: string;
  jd_count: number;
  skill_count: number;
  top_skills: string[];
};

export function listRoles(): RoleSummary[] {
  return ROLE_SLUGS.map((slug) => {
    const stats = getRoleStats(slug);
    return {
      slug,
      role: stats.role,
      jd_count: stats.jd_count,
      skill_count: stats.skills.length,
      top_skills: [...stats.skills]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 4)
        .map((entry) => entry.skill),
    };
  });
}

let blueprintCache: Record<string, ProofBlueprint> | null = null;

/** Curated proof project per skill, used when the planner runs without a model. */
export function getProofBlueprint(skill: string): ProofBlueprint | null {
  blueprintCache ??= proofBlueprintMapSchema.parse(proofProjectsJson);
  return blueprintCache[skill] ?? null;
}

export function getResources(skill: string): LearningResource[] {
  resourceCache ??= resourceMapSchema.parse(resourcesJson);
  return resourceCache[skill] ?? [];
}

/** Whitelist used to strip invented URLs out of model generated roadmap items. */
export function allowedResourceUrls(skills: string[]): Set<string> {
  const urls = new Set<string>();
  for (const skill of skills) {
    for (const resource of getResources(skill)) urls.add(resource.url);
  }
  return urls;
}

/** Static questions used when quiz generation is unavailable. */
export function getBankedQuestions(skillSlug: string): QuizQuestion[] {
  const raw = QUESTION_BANK_JSON[skillSlug];
  if (!raw) return [];
  const parsed = questionBankSchema.safeParse(raw);
  return parsed.success ? parsed.data.questions : [];
}

export function hasQuestionBank(skillSlug: string): boolean {
  return skillSlug in QUESTION_BANK_JSON;
}
