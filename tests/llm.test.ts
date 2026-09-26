import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { generateJson, RateLimitedError } from '@/lib/llm';
import { extractJsonBlock, stripThinkTags } from '@/lib/llm/json';
import type { LlmProvider, ProviderName, StepLogger } from '@/lib/llm';

const schema = z.object({ answer: z.string() });

function silentLogger(): StepLogger {
  const noop = async () => undefined;
  return { info: noop, warn: noop, error: noop };
}

/**
 * A reply of "429" makes the provider report a rate limit, "throw:x" raises a
 * plain error, anything else is returned as model text.
 */
function provider(name: ProviderName, replies: string[]): LlmProvider {
  const queue = [...replies];
  return {
    name,
    model: `${name}-test-model`,
    complete: vi.fn(async () => {
      const next = queue.shift();
      if (next === undefined) throw new Error('no more replies');
      if (next === '429') throw new RateLimitedError(name, 30);
      if (next.startsWith('throw:')) throw new Error(next.slice(6));
      return { text: next, usage: { prompt: 10, completion: 5, total: 15 } };
    }),
  };
}

function request(fallback?: () => { answer: string }) {
  return {
    schema,
    system: 'system',
    user: 'user',
    cacheKey: `test:${Math.random()}`,
    logger: silentLogger(),
    fallback,
  };
}

describe('stripThinkTags', () => {
  it('removes a paired reasoning block', () => {
    expect(stripThinkTags('<think>weighing options</think>{"answer":"yes"}')).toBe(
      '{"answer":"yes"}',
    );
  });

  it('removes an unterminated reasoning block that runs into the answer', () => {
    expect(stripThinkTags('<think>still reasoning {"answer":"no"}')).toBe(
      'still reasoning {"answer":"no"}',
    );
  });

  it('drops everything before a stray closing tag', () => {
    expect(stripThinkTags('reasoning text</think>{"answer":"yes"}')).toBe('{"answer":"yes"}');
  });

  it('leaves ordinary text alone', () => {
    expect(stripThinkTags('{"answer":"yes"}')).toBe('{"answer":"yes"}');
  });
});

describe('extractJsonBlock', () => {
  it('pulls JSON out of a fenced block with commentary around it', () => {
    const raw = 'Sure, here you go:\n```json\n{ "answer": "yes" }\n```\nHope that helps.';
    expect(JSON.parse(extractJsonBlock(raw))).toEqual({ answer: 'yes' });
  });

  it('handles an unfenced object and a top level array', () => {
    expect(JSON.parse(extractJsonBlock('noise {"a":1} tail'))).toEqual({ a: 1 });
    expect(JSON.parse(extractJsonBlock('[1,2,3]'))).toEqual([1, 2, 3]);
  });

  it('handles a reasoning block wrapped around a fenced answer', () => {
    const raw = '<think>let me think</think>\n```json\n{"answer":"clean"}\n```';
    expect(JSON.parse(extractJsonBlock(raw))).toEqual({ answer: 'clean' });
  });
});

describe('generateJson', () => {
  it('returns validated output from the first provider with its model and usage', async () => {
    const sarvam = provider('sarvam', ['{"answer":"first"}']);
    const result = await generateJson(request(), [sarvam]);
    expect(result.value).toEqual({ answer: 'first' });
    expect(result.source).toBe('sarvam');
    expect(result.model).toBe('sarvam-test-model');
    expect(result.usage?.total).toBe(15);
    expect(sarvam.complete).toHaveBeenCalledTimes(1);
  });

  it('retries once with the validation error appended before giving up on a provider', async () => {
    const sarvam = provider('sarvam', ['{"wrong":"shape"}', '{"answer":"repaired"}']);
    const result = await generateJson(request(), [sarvam]);
    expect(result.value).toEqual({ answer: 'repaired' });

    const secondCall = vi.mocked(sarvam.complete).mock.calls[1];
    expect(secondCall?.[1]).toContain('rejected by schema validation');
    expect(secondCall?.[1]).toContain('answer');
  });

  it('moves to the next provider immediately on a rate limit, without retrying', async () => {
    const sarvam = provider('sarvam', ['429', '{"answer":"never reached"}']);
    const groq = provider('groq', ['{"answer":"from groq"}']);
    const result = await generateJson(request(), [sarvam, groq]);

    expect(result.source).toBe('groq');
    expect(sarvam.complete).toHaveBeenCalledTimes(1);
  });

  it('falls through the whole chain to the last provider', async () => {
    const sarvam = provider('sarvam', ['not json', 'still not json']);
    const groq = provider('groq', ['429']);
    const gemini = provider('gemini', ['{"answer":"from gemini"}']);
    const result = await generateJson(request(), [sarvam, groq, gemini]);

    expect(result.source).toBe('gemini');
    expect(sarvam.complete).toHaveBeenCalledTimes(2);
    expect(groq.complete).toHaveBeenCalledTimes(1);
  });

  it('strips a reasoning block before validating', async () => {
    const sarvam = provider('sarvam', ['<think>deciding</think>{"answer":"thought about it"}']);
    const result = await generateJson(request(), [sarvam]);
    expect(result.value).toEqual({ answer: 'thought about it' });
  });

  it('uses the deterministic fallback when every provider is down', async () => {
    const sarvam = provider('sarvam', ['throw:timeout', 'throw:timeout']);
    const groq = provider('groq', ['429']);
    const result = await generateJson(request(() => ({ answer: 'deterministic' })), [sarvam, groq]);
    expect(result).toEqual({
      value: { answer: 'deterministic' },
      source: 'fallback',
      model: null,
      usage: null,
    });
  });

  it('uses the deterministic fallback when no provider is configured', async () => {
    const result = await generateJson(request(() => ({ answer: 'deterministic' })), []);
    expect(result.source).toBe('fallback');
  });

  it('throws only when there is neither a provider nor a fallback', async () => {
    await expect(generateJson(request(), [])).rejects.toThrow(/No language model is available/);
  });
});
