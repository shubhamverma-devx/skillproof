import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLM } from '@/lib/config';
import type { LlmProvider } from '../types';

export function createGeminiProvider(apiKey: string): LlmProvider {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: LLM.geminiModel,
    generationConfig: { responseMimeType: 'application/json' },
  });

  return {
    name: 'gemini',
    async complete(system, user) {
      const result = await model.generateContent({
        systemInstruction: system,
        contents: [{ role: 'user', parts: [{ text: user }] }],
      });
      return result.response.text().trim();
    },
  };
}
