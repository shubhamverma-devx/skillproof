/**
 * Confirms which model providers are reachable with the keys in .env.local.
 *
 *   pnpm providers:check
 *
 * For each configured provider it lists the models endpoint if the provider
 * exposes one, then makes one tiny JSON call and reports the token usage. No key
 * is ever printed.
 */
import { config } from 'dotenv';
import { z } from 'zod';
import { LLM } from '../lib/config';
import { generateJson } from '../lib/llm';
import { buildProviderChain } from '../lib/llm/providers';
import type { LlmProvider } from '../lib/llm/types';

config({ path: '.env.local' });

const probeSchema = z.object({ city: z.string(), country: z.string() });

const MODELS_ENDPOINT: Partial<Record<string, string>> = {
  sarvam: `${LLM.sarvam.baseUrl}/models`,
  groq: `${LLM.groq.baseUrl}/models`,
};

const API_KEY_ENV: Record<string, string> = {
  sarvam: 'SARVAM_API_KEY',
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

async function listModels(provider: LlmProvider): Promise<string> {
  const endpoint = MODELS_ENDPOINT[provider.name];
  if (!endpoint) return 'no models endpoint, checked by calling the model directly';

  const key = process.env[API_KEY_ENV[provider.name] ?? ''];
  try {
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${key}` } });
    if (!response.ok) return `models endpoint returned ${response.status}`;

    const payload = (await response.json()) as { data?: Array<{ id?: string }> };
    const ids = (payload.data ?? []).map((entry) => entry.id).filter(Boolean) as string[];
    const listed = ids.includes(provider.model);
    return `${ids.length} models listed, ${provider.model} ${listed ? 'present' : 'NOT present'}`;
  } catch (error) {
    return `models endpoint failed: ${error instanceof Error ? error.message : 'unknown'}`;
  }
}

async function probe(provider: LlmProvider): Promise<void> {
  process.stdout.write(`\n${provider.name} (${provider.model})\n`);
  process.stdout.write(`  models: ${await listModels(provider)}\n`);

  const started = Date.now();
  try {
    const result = await generateJson(
      {
        schema: probeSchema,
        system: 'You answer with JSON only, no commentary.',
        user: 'Return {"city":"Bengaluru","country":"India"} exactly.',
        cacheKey: `probe:${provider.name}:${Date.now()}`,
      },
      [provider],
    );
    const tokens = result.usage ? `${result.usage.total} tokens` : 'usage not reported';
    process.stdout.write(
      `  call: ok in ${Date.now() - started}ms, ${tokens}, parsed ${JSON.stringify(result.value)}\n`,
    );
  } catch (error) {
    process.stdout.write(
      `  call: FAILED, ${error instanceof Error ? error.message : 'unknown error'}\n`,
    );
  }
}

async function main(): Promise<void> {
  const chain = buildProviderChain();
  if (chain.length === 0) {
    process.stdout.write(
      'No provider keys found in .env.local. The product still runs on deterministic logic.\n',
    );
    return;
  }

  process.stdout.write(`Chain order: ${chain.map((provider) => provider.name).join(' then ')}\n`);
  for (const provider of chain) await probe(provider);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
