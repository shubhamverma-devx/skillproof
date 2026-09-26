'use client';

import { useEffect, useState } from 'react';

const DURATION_MS = 900;

/** Counts from `from` to `to` once, and jumps straight to `to` for reduced motion. */
export function useCountUp(to: number, from = 0): number {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - progress) ** 3;
      setValue(from + (to - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, from]);

  return value;
}

/** True once the component has mounted, used to trigger the one entry animation. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
