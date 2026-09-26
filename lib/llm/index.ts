import { LLM } from '@/lib/config';
import { readCachedResponse, writeCachedResponse } from './cache';
import { parseJsonBlock } from './json';
import { buildProviderChain } from './providers';
import {
  LlmUnavailableError,
  RateLimitedError,
  type JsonRequest,
  type JsonResult,
  type LlmProvider,
  type StepLogger,
} from './types';

export { LlmUnavailableError, RateLimitedError } from './types';
export { hashText, makeCacheKey } from './cache';
export { buildProviderChain, isSarvamPrimary } from './providers';
export type { JsonRequest, JsonResult, LlmProvider, ProviderName, StepLogger } from './types';

const LABEL: Record<string, string> = {
  sarvam: 'Sarvam AI',
  groq: 'Groq',
  gemini: 'Google Gemini',
};

function describe(provider: LlmProvider): string {
  return `${LABEL[provider.name] ?? provider.name} (${provider.model})`;
}

function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

/**
 * Single entry point for every model call in the product.
 *
 * Order of attempts: cached demo response, then each configured provider with
 * one repair retry carrying the validation error, then the caller's
 * deterministic fallback. A provider that reports a rate limit is abandoned at
 * once rather than retried. Every transition is written to the agent trace,
 * which is what the Agent Trace panel shows the user.
 */
export async function generateJson<T>(
  request: JsonRequest<T>,
  providers: LlmProvider[] = buildProviderChain(),
): Promise<JsonResult<T>> {
  const { schema, cacheKey, logger, fallback } = request;

  const cached = readCachedResponse(cacheKey);
  if (cached !== undefined) {
    const parsed = schema.safeParse(cached);
    if (parsed.success) {
      await logger?.info('Cached response used', `${cacheKey} served from the demo cache`);
      return { value: parsed.data, source: 'cache', model: null, usage: null };
    }
    await logger?.warn('Cache entry rejected', `${cacheKey} no longer matches the schema`);
  }

  for (const [index, provider] of providers.entries()) {
    const result = await tryProvider(provider, request, logger);
    if (result) {
      if (isDemoMode()) await writeCachedResponse(cacheKey, result.value);
      return result;
    }

    const next = providers[index + 1];
    if (next) {
      await logger?.warn(
        'Provider switched',
        `${describe(provider)} could not answer, trying ${describe(next)}`,
      );
    }
  }

  if (fallback) {
    await logger?.warn(
      'Deterministic fallback',
      `No model output for ${cacheKey}, using built in logic instead`,
    );
    return { value: fallback(), source: 'fallback', model: null, usage: null };
  }

  throw new LlmUnavailableError(
    'No language model is available and this step has no deterministic fallback.',
  );
}

async function tryProvider<T>(
  provider: LlmProvider,
  request: JsonRequest<T>,
  logger?: StepLogger,
): Promise<JsonResult<T> | null> {
  let repairNote = '';

  for (let attempt = 0; attempt <= LLM.jsonRepairAttempts; attempt += 1) {
    try {
      const reply = await provider.complete(request.system, request.user + repairNote);
      const parsed = request.schema.safeParse(parseJsonBlock(reply.text));

      if (parsed.success) {
        await logger?.info(
          'Model output validated',
          `${describe(provider)} returned valid JSON for ${request.cacheKey}${
            reply.usage ? `, ${reply.usage.total} tokens` : ''
          }`,
        );
        return {
          value: parsed.data,
          source: provider.name,
          model: provider.model,
          usage: reply.usage,
        };
      }

      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ');
      await logger?.warn(
        'Model output failed validation',
        `${describe(provider)} attempt ${attempt + 1}: ${issues}`,
      );
      repairNote = `\n\nYour previous reply was rejected by schema validation: ${issues}\nReturn corrected JSON only, with no commentary.`;
    } catch (error) {
      if (error instanceof RateLimitedError) {
        // Waiting out a free tier limit would stall the request, so the chain
        // moves on immediately and says so on the trace.
        await logger?.warn('Provider rate limited', `${describe(provider)}: ${error.message}`);
        return null;
      }

      const message = error instanceof Error ? error.message : 'unknown error';
      await logger?.warn(
        'Model call failed',
        `${describe(provider)} attempt ${attempt + 1}: ${message}`,
      );
      repairNote = '';
    }
  }

  return null;
}
