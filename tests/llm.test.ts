import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { extractJsonBlock } from '@/lib/llm/json';
import { generateJson } from '@/lib/llm';
import type { LlmProvider, StepLogger } from '@/lib/llm';

const schema = z.object({ answer: z.string() });

function silentLogger(): StepLogger {
  const noop = async () => undefined;
  return { info: noop, warn: noop, error: noop };
}

function provider(name: 'anthropic' | 'gemini', replies: string[]): LlmProvider {
  const queue = [...replies];
  return {
    name,
    complete: vi.fn(async () => {
      const next = queue.shift();
      if (next === undefined) throw new Error('no more replies');
      if (next.startsWith('throw:')) throw new Error(next.slice(6));
      return next;
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

describe('extractJsonBlock', () => {
  it('pulls JSON out of a fenced block with commentary around it', () => {
    const raw = 'Sure, here you go:\n```json\n{ "answer": "yes" }\n```\nHope that helps.';
    expect(JSON.parse(extractJsonBlock(raw))).toEqual({ answer: 'yes' });
  });

  it('handles an unfenced object and a top level array', () => {
    expect(JSON.parse(extractJsonBlock('noise {"a":1} tail'))).toEqual({ a: 1 });
    expect(JSON.parse(extractJsonBlock('[1,2,3]'))).toEqual([1, 2, 3]);
  });
});

describe('generateJson', () => {
  it('returns validated output from the first provider', async () => {
    const primary = provider('anthropic', ['{"answer":"first"}']);
    const result = await generateJson(request(), [primary]);
    expect(result).toEqual({ value: { answer: 'first' }, source: 'anthropic' });
    expect(primary.complete).toHaveBeenCalledTimes(1);
  });

  it('retries once with the validation error appended before giving up on a provider', async () => {
    const primary = provider('anthropic', ['{"wrong":"shape"}', '{"answer":"repaired"}']);
    const result = await generateJson(request(), [primary]);
    expect(result.value).toEqual({ answer: 'repaired' });

    const secondCall = vi.mocked(primary.complete).mock.calls[1];
    expect(secondCall?.[1]).toContain('rejected by schema validation');
    expect(secondCall?.[1]).toContain('answer');
  });

  it('falls back to the second provider after the first is exhausted', async () => {
    const primary = provider('anthropic', ['not json at all', 'still not json']);
    const secondary = provider('gemini', ['{"answer":"from gemini"}']);
    const result = await generateJson(request(), [primary, secondary]);
    expect(result).toEqual({ value: { answer: 'from gemini' }, source: 'gemini' });
    expect(primary.complete).toHaveBeenCalledTimes(2);
  });

  it('treats a thrown provider error like an invalid response', async () => {
    const primary = provider('anthropic', ['throw:timeout', 'throw:timeout']);
    const result = await generateJson(
      request(() => ({ answer: 'deterministic' })),
      [primary],
    );
    expect(result).toEqual({ value: { answer: 'deterministic' }, source: 'fallback' });
  });

  it('uses the deterministic fallback when no provider is configured', async () => {
    const result = await generateJson(
      request(() => ({ answer: 'deterministic' })),
      [],
    );
    expect(result).toEqual({ value: { answer: 'deterministic' }, source: 'fallback' });
  });

  it('throws only when there is neither a provider nor a fallback', async () => {
    await expect(generateJson(request(), [])).rejects.toThrow(/No language model is available/);
  });
});
