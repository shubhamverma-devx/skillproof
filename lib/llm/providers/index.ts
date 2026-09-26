import { LLM } from '@/lib/config';
import type { LlmProvider, ProviderName } from '../types';
import { createGeminiProvider } from './gemini';
import { createOpenAiCompatibleProvider } from './openai-compatible';

const ORDER: ProviderName[] = ['sarvam', 'groq', 'gemini'];

function create(name: ProviderName): LlmProvider | null {
  if (name === 'sarvam') {
    const apiKey = process.env.SARVAM_API_KEY;
    return apiKey
      ? createOpenAiCompatibleProvider({
          name: 'sarvam',
          baseUrl: LLM.sarvam.baseUrl,
          apiKey,
          model: process.env.SARVAM_MODEL ?? LLM.sarvam.model,
          // Structured output only: the cheapest reasoning setting keeps the
          // reply inside max_tokens, since reasoning is billed as completion.
          reasoningEffort: 'low',
        })
      : null;
  }

  if (name === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    return apiKey
      ? createOpenAiCompatibleProvider({
          name: 'groq',
          baseUrl: LLM.groq.baseUrl,
          apiKey,
          model: process.env.GROQ_MODEL ?? LLM.groq.model,
        })
      : null;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? createGeminiProvider(apiKey, process.env.GEMINI_MODEL ?? LLM.gemini.model) : null;
}

function isProviderName(value: string): value is ProviderName {
  return (ORDER as string[]).includes(value);
}

/**
 * The provider chain for this process, in the order it will be tried. Only
 * providers with a key configured appear, and LLM_PRIMARY can promote one of
 * them to the front without changing the code.
 */
export function buildProviderChain(): LlmProvider[] {
  const configured = ORDER.map(create).filter((provider): provider is LlmProvider => provider !== null);

  const preferred = process.env.LLM_PRIMARY?.trim().toLowerCase();
  if (!preferred || !isProviderName(preferred)) return configured;

  const promoted = configured.find((provider) => provider.name === preferred);
  if (!promoted) return configured;

  return [promoted, ...configured.filter((provider) => provider !== promoted)];
}

/** True when Sarvam is configured and first in line, used for the footer credit. */
export function isSarvamPrimary(): boolean {
  return buildProviderChain()[0]?.name === 'sarvam';
}
