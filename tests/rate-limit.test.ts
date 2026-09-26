import { afterEach, describe, expect, it, vi } from 'vitest';
import { RATE_LIMITS } from '@/lib/config';
import { JsonStore } from '@/lib/db/json-store';
import { clientKey } from '@/lib/rate-limit';

function requestFrom(headers: Record<string, string>): Request {
  return new Request('https://example.test/api/analyze/1', { method: 'POST', headers });
}

describe('clientKey', () => {
  it('takes the first address from x-forwarded-for, which is the real client', () => {
    expect(clientKey(requestFrom({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' }))).toBe(
      '203.0.113.7',
    );
  });

  it('falls back to x-real-ip', () => {
    expect(clientKey(requestFrom({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
  });

  it('groups requests with no address together rather than exempting them', () => {
    expect(clientKey(requestFrom({}))).toBe('unknown-client');
    expect(clientKey(requestFrom({ 'x-forwarded-for': '  ' }))).toBe('unknown-client');
  });
});

describe('counter behaviour', () => {
  const store = new JsonStore();

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts each call within the window', async () => {
    const bucket = `test:${Math.random()}`;
    expect(await store.consumeRateLimit(bucket, 60)).toBe(1);
    expect(await store.consumeRateLimit(bucket, 60)).toBe(2);
    expect(await store.consumeRateLimit(bucket, 60)).toBe(3);
  });

  it('keeps separate callers separate', async () => {
    const seed = Math.random();
    expect(await store.consumeRateLimit(`a:${seed}`, 60)).toBe(1);
    expect(await store.consumeRateLimit(`b:${seed}`, 60)).toBe(1);
  });

  it('starts a fresh count once the window has passed', async () => {
    vi.useFakeTimers();
    const bucket = `expiry:${Math.random()}`;
    expect(await store.consumeRateLimit(bucket, 60)).toBe(1);
    expect(await store.consumeRateLimit(bucket, 60)).toBe(2);

    vi.advanceTimersByTime(61_000);
    expect(await store.consumeRateLimit(bucket, 60)).toBe(1);
  });
});

describe('configured limits', () => {
  it('lets a real student finish a quiz and a roadmap without being blocked', () => {
    // Four questions per attempt, and a student may verify several skills.
    expect(RATE_LIMITS.quiz.limit).toBeGreaterThanOrEqual(40);
    // One analysis is expensive, so the ceiling is low but not one.
    expect(RATE_LIMITS.analyze.limit).toBeGreaterThanOrEqual(3);
    expect(RATE_LIMITS.analyze.limit).toBeLessThan(RATE_LIMITS.quiz.limit);
    for (const rule of Object.values(RATE_LIMITS)) {
      expect(rule.windowSeconds).toBeGreaterThan(0);
      expect(rule.limit).toBeGreaterThan(0);
    }
  });
});
