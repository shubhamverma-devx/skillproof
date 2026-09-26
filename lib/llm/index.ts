import { LLM } from '@/lib/config';
import { readCachedResponse, writeCachedResponse } from './cache';
import { parseJsonBlock } from './json';
import { createAnthropicProvider } from './providers/anthropic';
import { createGeminiProvider } from './providers/gemini';
import {
  LlmUnavailableError,
  type JsonRequest,
  type JsonResult,
  type LlmProvider,
  type StepLogger,
} from './types';

export { LlmUnavailableError } from './types';
export type { JsonRequest, JsonResult, LlmProvider, StepLogger } from './types';

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

export function availableProviders(): LlmProvider[] {
  const providers: LlmProvider[] = [];
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push(createAnthropicProvider(process.env.ANTHROPIC_API_KEY));
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push(createGeminiProvider(process.env.GEMINI_API_KEY));
  }
  return providers;
}

/**
 * Single entry point for every model call in the product.
 *
 * Order of attempts: cached demo response, then each configured provider with
 * one repair retry carrying the validation error, then the caller's
 * deterministic fallback. Every transition is written to the agent trace, which
 * is what the Agent Trace panel shows the user.
 */
export async function generateJson<T>(
  request: JsonRequest<T>,
  providers: LlmProvider[] = availableProviders(),
): Promise<JsonResult<T>> {
  const { schema, cacheKey, logger, fallback } = request;

  const cached = await readCachedResponse(cacheKey);
  if (cached !== undefined) {
    const parsed = schema.safeParse(cached);
    if (parsed.success) {
      await logger?.info('Cached response used', `${cacheKey} served from demo cache`);
      return { value: parsed.data, source: 'cache' };
    }
    await logger?.warn('Cache entry rejected', `${cacheKey} no longer matches the schema`);
  }

  for (const provider of providers) {
    const result = await tryProvider(provider, request, logger);
    if (result) {
      if (isDemoMode()) await writeCachedResponse(cacheKey, result.value);
      return result;
    }
  }

  if (fallback) {
    await logger?.warn(
      'Deterministic fallback',
      `No model output for ${cacheKey}, using built in logic instead`,
    );
    return { value: fallback(), source: 'fallback' };
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
      const raw = await withTimeout(
        provider.complete(request.system, request.user + repairNote),
        LLM.timeoutMs,
        `${provider.name} timed out after ${LLM.timeoutMs / 1000}s`,
      );
      const parsed = request.schema.safeParse(parseJsonBlock(raw));
      if (parsed.success) {
        await logger?.info(
          'Model output validated',
          `${provider.name} returned valid JSON for ${request.cacheKey}`,
        );
        return { value: parsed.data, source: provider.name };
      }

      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ');
      await logger?.warn(
        'Model output failed validation',
        `${provider.name} attempt ${attempt + 1}: ${issues}`,
      );
      repairNote = `\n\nYour previous reply was rejected by schema validation: ${issues}\nReturn corrected JSON only, with no commentary.`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      await logger?.warn('Model call failed', `${provider.name} attempt ${attempt + 1}: ${message}`);
      repairNote = '';
    }
  }

  await logger?.warn('Provider exhausted', `Moving past ${provider.name}`);
  return null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
