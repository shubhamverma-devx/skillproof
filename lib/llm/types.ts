import type { z } from 'zod';

export type ProviderName = 'anthropic' | 'gemini';
export type JsonSource = ProviderName | 'cache' | 'fallback';

export interface LlmProvider {
  readonly name: ProviderName;
  /** Returns raw model text; JSON parsing and validation happen one layer up. */
  complete(system: string, user: string): Promise<string>;
}

/** Subset of the agent tracer the LLM layer needs, kept structural to avoid a cycle. */
export interface StepLogger {
  info(step: string, detail: string): Promise<void>;
  warn(step: string, detail: string): Promise<void>;
  error(step: string, detail: string): Promise<void>;
}

export type JsonRequest<T> = {
  schema: z.ZodType<T>;
  system: string;
  user: string;
  /** Stable key used to read and write the demo response cache. */
  cacheKey: string;
  logger?: StepLogger;
  /** Deterministic last resort so the pipeline never dead-ends on LLM failure. */
  fallback?: () => T;
};

export type JsonResult<T> = { value: T; source: JsonSource };

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}
