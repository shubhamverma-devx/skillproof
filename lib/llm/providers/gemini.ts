import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLM } from '@/lib/config';
import { RateLimitedError, type LlmProvider, type LlmReply } from '../types';

/** Last provider in the chain, on the Google AI Studio free tier. */
export function createGeminiProvider(apiKey: string, modelId: string): LlmProvider {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelId,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: LLM.temperature,
      maxOutputTokens: LLM.maxOutputTokens,
    },
  });

  return {
    name: 'gemini',
    model: modelId,

    async complete(system, user): Promise<LlmReply> {
      try {
        const result = await model.generateContent({
          systemInstruction: system,
          contents: [{ role: 'user', parts: [{ text: user }] }],
        });

        const usage = result.response.usageMetadata;
        return {
          text: result.response.text().trim(),
          usage: usage
            ? {
                prompt: usage.promptTokenCount,
                completion: usage.candidatesTokenCount,
                total: usage.totalTokenCount,
              }
            : null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('429') || message.toLowerCase().includes('quota')) {
          throw new RateLimitedError('gemini', null);
        }
        throw error instanceof Error ? error : new Error(message);
      }
    },
  };
}
