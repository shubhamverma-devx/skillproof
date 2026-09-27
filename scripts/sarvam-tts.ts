/**
 * Speaks one line through Sarvam AI's text to speech, with a local cache.
 *
 *   https://api.sarvam.ai/text-to-speech, model bulbul:v3
 *
 * Every clip is cached by what produced it, so re-running the build to change
 * one sentence does not re-bill the whole script.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ENDPOINT = 'https://api.sarvam.ai/text-to-speech';
const MODEL = 'bulbul:v3';
const SAMPLE_RATE = 24000;

export type Clip = { file: string; seconds: number };

type Response = { audios?: string[] };

function apiKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error('SARVAM_API_KEY is not set. Load it from .env.local first.');
  return key;
}

/** Reads the real length off the file rather than trusting a words per minute guess. */
export function durationOf(file: string): number {
  const out = execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=nw=1:nk=1',
    file,
  ]);
  return Number(out.toString().trim());
}

export async function speak(
  text: string,
  options: { speaker: string; pace: number; cacheDir: string },
): Promise<Clip> {
  const fingerprint = createHash('sha256')
    .update(`${MODEL}|${options.speaker}|${options.pace}|${SAMPLE_RATE}|${text}`)
    .digest('hex')
    .slice(0, 16);

  mkdirSync(options.cacheDir, { recursive: true });
  const file = path.join(options.cacheDir, `${fingerprint}.wav`);
  if (existsSync(file)) return { file, seconds: durationOf(file) };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      language_code: 'en-IN',
      model: MODEL,
      speaker: options.speaker,
      pace: options.pace,
      speech_sample_rate: SAMPLE_RATE,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sarvam text to speech failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as Response;
  const audio = payload.audios?.[0];
  if (!audio) throw new Error('Sarvam returned no audio for a line');

  writeFileSync(file, Buffer.from(audio, 'base64'));
  return { file, seconds: durationOf(file) };
}
