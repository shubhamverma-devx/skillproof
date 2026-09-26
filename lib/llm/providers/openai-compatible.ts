import { LLM } from '@/lib/config';
import { RateLimitedError, type LlmProvider, type LlmReply, type ProviderName } from '../types';

type ChatResponse = {
  choices?: Array<{ message?: { content?: string | null; reasoning_content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

export type OpenAiCompatibleConfig = {
  name: ProviderName;
  baseUrl: string;
  apiKey: string;
  model: string;
  /** Sarvam accepts low, high and max. Groq ignores an unknown field. */
  reasoningEffort?: 'low' | 'high' | 'max';
};

/**
 * One adapter for every OpenAI shaped chat completions API. Sarvam and Groq
 * differ only in base URL, model id and whether reasoning effort is accepted, so
 * a second copy of this code would only be a second place for bugs to live.
 */
export function createOpenAiCompatibleProvider(config: OpenAiCompatibleConfig): LlmProvider {
  return {
    name: config.name,
    model: config.model,

    async complete(system, user): Promise<LlmReply> {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(LLM.timeoutMs),
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: LLM.temperature,
          max_tokens: LLM.maxOutputTokens,
          // Every call in this product asks for JSON, so the provider is told so
          // rather than being asked politely in the prompt.
          response_format: { type: 'json_object' },
          ...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
        }),
      });

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after'));
        throw new RateLimitedError(config.name, Number.isFinite(retryAfter) ? retryAfter : null);
      }

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        throw new Error(`${config.name} responded ${response.status}: ${detail}`);
      }

      const payload = (await response.json()) as ChatResponse;
      const message = payload.choices?.[0]?.message;
      const text = (message?.content ?? '').trim();
      if (!text) throw new Error(`${config.name} returned an empty message`);

      return {
        text,
        usage: payload.usage
          ? {
              prompt: payload.usage.prompt_tokens ?? 0,
              completion: payload.usage.completion_tokens ?? 0,
              total: payload.usage.total_tokens ?? 0,
            }
          : null,
      };
    },
  };
}
