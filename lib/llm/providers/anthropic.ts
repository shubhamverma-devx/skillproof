import Anthropic from '@anthropic-ai/sdk';
import { LLM } from '@/lib/config';
import type { LlmProvider } from '../types';

export function createAnthropicProvider(apiKey: string): LlmProvider {
  const client = new Anthropic({ apiKey, timeout: LLM.timeoutMs, maxRetries: 0 });

  return {
    name: 'anthropic',
    async complete(system, user) {
      const response = await client.messages.create({
        model: process.env.LLM_MODEL ?? LLM.defaultModel,
        max_tokens: LLM.maxOutputTokens,
        system,
        messages: [{ role: 'user', content: user }],
      });

      return response.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('')
        .trim();
    },
  };
}
