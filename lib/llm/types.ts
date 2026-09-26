import type { z } from 'zod';

export type ProviderName = 'sarvam' | 'groq' | 'gemini';
export type JsonSource = ProviderName | 'cache' | 'fallback';

export type TokenUsage = { prompt: number; completion: number; total: number };

export type LlmReply = { text: string; usage: TokenUsage | null };

export interface LlmProvider {
  readonly name: ProviderName;
  readonly model: string;
  /** Returns raw model text; JSON parsing and validation happen one layer up. */
  complete(system: string, user: string): Promise<LlmReply>;
}

/** Thrown when a provider says it is out of quota, so the chain moves on at once. */
export class RateLimitedError extends Error {
  constructor(
    readonly provider: ProviderName,
    readonly retryAfterSeconds: number | null,
  ) {
    super(
      `${provider} is rate limited${retryAfterSeconds ? `, retry after ${retryAfterSeconds}s` : ''}`,
    );
    this.name = 'RateLimitedError';
  }
}

/** Subset of the agent tracer the LLM layer needs, kept structural to avoid a cycle. */
export interface StepLogger {
  info(step: string, detail: string): Promise<void>;
  warn(step: string, detail: string): Promise<void>;
  error(step: string, detail: string): Promise<void>;
}

export type JsonRequest<T> = {
  /** Input side is unknown: the value being validated is raw model output. */
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  system: string;
  user: string;
  /** Stable key used to read and write the demo response cache. */
  cacheKey: string;
  logger?: StepLogger;
  /** Deterministic last resort so the pipeline never dead-ends on LLM failure. */
  fallback?: () => T;
};

export type JsonResult<T> = {
  value: T;
  source: JsonSource;
  /** Which model produced it, for the agent trace. Null for cache and fallback. */
  model: string | null;
  usage: TokenUsage | null;
};

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}
