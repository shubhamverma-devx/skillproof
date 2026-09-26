/**
 * Every tunable number in the product lives here so the scoring rules stay
 * auditable and the agent prompts cannot drift from the deterministic core.
 */

/** Proficiency assigned when a skill has no quiz score to rely on. */
export const PROFICIENCY_BY_EVIDENCE = {
  observedAndClaimed: 0.6,
  observedOnly: 0.5,
  claimedOnly: 0.3,
  none: 0,
} as const;

export const QUIZ = {
  questionsPerSkill: 4,
  startDifficulty: 'medium',
  difficultyWeights: { easy: 0.6, medium: 1.0, hard: 1.4 },
  /** How many role-relevant skills the dashboard offers for verification. */
  offeredSkillCount: 5,
} as const;

export const LLM = {
  timeoutMs: 20_000,
  /** Sarvam bills reasoning as completion tokens, so the cap covers both. */
  maxOutputTokens: 4096,
  temperature: 0.2,
  /** One repair attempt with the validation error appended, then provider swap. */
  jsonRepairAttempts: 1,
  sarvam: {
    baseUrl: 'https://api.sarvam.ai/v1',
    // The conversations variant of the same 105B family. Measured against
    // sarvam-105b on this workload it answers in under a second instead of two
    // to twenty four seconds, and emits no reasoning tokens, which are billed as
    // completion tokens. Every call here is structured extraction, not open
    // ended reasoning, so the tradeoff is free. Override with SARVAM_MODEL.
    model: 'sarvam-105b-conversations',
  },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b' },
  gemini: { model: 'gemini-3.8-flash' },
} as const;

export const ROADMAP = {
  defaultWeeks: 8,
  minItemHours: 2,
  maxItemHours: 12,
  /** Gaps considered when planning; beyond this the plan stops being actionable. */
  maxPlannedSkills: 14,
} as const;

export const GITHUB = {
  maxRepos: 15,
  readmeSnippetChars: 1500,
  apiRoot: 'https://api.github.com',
  requestTimeoutMs: 10_000,
} as const;

export const SCORING = {
  /** A quiz at or above this score earns the verified badge. */
  verifiedThreshold: 0.6,
  topGapCount: 6,
} as const;

/**
 * Per client limits on the routes that cost money to serve, either in model
 * credits or against the GitHub token's quota. The windows are deliberately
 * generous for a real student and tight enough that a script cannot drain an
 * account. Cached demo traffic is exempt: it calls nothing.
 */
export const RATE_LIMITS = {
  /** Resume parsing plus a model call to structure it. */
  createProfile: { limit: 12, windowSeconds: 600 },
  /** The heaviest route: a full GitHub scan plus several model calls. */
  analyze: { limit: 6, windowSeconds: 600 },
  /** One model call per question, four per attempt. */
  quiz: { limit: 80, windowSeconds: 600 },
  /** One model call for the whole plan. */
  roadmap: { limit: 15, windowSeconds: 600 },
  /** Repository scans and replans, both of which reach out. */
  progress: { limit: 30, windowSeconds: 600 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

export const WEEKLY_HOURS = { min: 2, max: 25, default: 8, step: 1 } as const;
