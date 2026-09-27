/**
 * Reads docs/VOICEOVER.md into the beats the narration is built from.
 *
 * The markdown is the single source of truth: it carries the window each line
 * has to fit, measured against docs/video/timings.json, so nothing here invents
 * timing of its own.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

export type Beat = {
  /** Seconds into the video where this beat starts. */
  start: number;
  /** Seconds into the video where the next beat starts. */
  end: number;
  /** What is on screen, for logs. */
  label: string;
  /** One entry per spoken sentence, in order. */
  sentences: string[];
};

const BEAT_PATTERN =
  /\*\*(\d+:\d+) to (\d+:\d+)\*\* \| (.+?)_\(\d+ words\)_\n(.*?)(?=\n\*\*\d+:\d+ to|\n---)/gs;

function toSeconds(clock: string): number {
  const [minutes, seconds] = clock.split(':');
  return Number(minutes) * 60 + Number(seconds);
}

/** Blockquote lines become paragraphs, then paragraphs become sentences. */
function toSentences(body: string): string[] {
  const paragraphs = body
    .split('\n')
    .map((line) => line.replace(/^\s*>\s?/, '').trim())
    .join('\n')
    .split(/\n\s*\n/);

  return paragraphs
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph.length > 0)
    .flatMap((paragraph) => paragraph.split(/(?<=[.?!])\s+/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

export function loadBeats(): Beat[] {
  const file = path.join(process.cwd(), 'docs', 'VOICEOVER.md');
  const markdown = readFileSync(file, 'utf8');

  const beats: Beat[] = [];
  for (const match of markdown.matchAll(BEAT_PATTERN)) {
    const [, from, to, label, body] = match;
    if (!from || !to || !label || body === undefined) continue;
    beats.push({
      start: toSeconds(from),
      end: toSeconds(to),
      label: label.replace(/\|/g, '').trim(),
      sentences: toSentences(body),
    });
  }

  if (beats.length === 0) throw new Error('docs/VOICEOVER.md has no beats to read');
  return beats;
}
