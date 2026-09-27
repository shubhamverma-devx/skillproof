/**
 * Narrates the silent demo with Sarvam AI and burns English subtitles onto it.
 *
 *   pnpm narrate                 rebuild from docs/VOICEOVER.md
 *   pnpm narrate --speaker ritu  use a different Sarvam voice
 *
 * Every line is spoken into its own clip, measured, and placed at the beat it
 * belongs to, so the subtitles come from where the audio actually lands rather
 * than from an estimate. Clips are cached, so a re-run only pays for what
 * changed.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadBeats } from './voiceover-script';
import { renderCaptions } from './caption-images';
import { durationOf, speak, type Clip } from './sarvam-tts';

const VIDEO = path.join(process.cwd(), 'docs', 'video');
const SILENT = path.join(VIDEO, 'skillproof-demo.mp4');
const CACHE = path.join(VIDEO, 'narration');
const CAPTIONS = path.join(VIDEO, 'captions');
const FRAME = { width: 1440, height: 900 };

/** Sarvam speaks near 214 words a minute at pace 1, which is too fast to follow. */
const PACES = [0.8, 0.9, 1, 1.1, 1.2];
/** A breath between sentences, so lines do not run into each other. */
const GAP = 0.25;
/** Two lines of about this width is the most a viewer can read in one cue. */
const CUE_CHARS = 84;

type Cue = { start: number; end: number; text: string };
type Placed = { clip: Clip; at: number; text: string };

function flag(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback);
}

function clock(seconds: number): string {
  const whole = Math.floor(seconds);
  const ms = Math.round((seconds - whole) * 1000);
  const h = String(Math.floor(whole / 3600)).padStart(2, '0');
  const m = String(Math.floor((whole % 3600) / 60)).padStart(2, '0');
  const s = String(whole % 60).padStart(2, '0');
  return `${h}:${m}:${s},${String(ms).padStart(3, '0')}`;
}

/** Splits a long sentence into cue sized pieces at word boundaries. */
function toChunks(sentence: string): string[] {
  if (sentence.length <= CUE_CHARS) return [sentence];
  const words = sentence.split(' ');
  const pieces = Math.ceil(sentence.length / CUE_CHARS);
  const perPiece = Math.ceil(words.length / pieces);
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += perPiece) {
    chunks.push(words.slice(index, index + perPiece).join(' '));
  }
  return chunks;
}

/** Wraps a cue onto at most two balanced lines. */
function wrap(text: string): string {
  if (text.length <= CUE_CHARS / 2) return text;
  const words = text.split(' ');
  let best = text;
  let bestGap = Number.POSITIVE_INFINITY;
  for (let split = 1; split < words.length; split += 1) {
    const top = words.slice(0, split).join(' ');
    const bottom = words.slice(split).join(' ');
    const gap = Math.abs(top.length - bottom.length);
    if (gap < bestGap) {
      bestGap = gap;
      best = `${top}\n${bottom}`;
    }
  }
  return best;
}

async function speakBeat(
  sentences: string[],
  window: number,
  speaker: string,
): Promise<{ clips: Clip[]; pace: number }> {
  let last: { clips: Clip[]; pace: number } | null = null;

  for (const pace of PACES) {
    const clips: Clip[] = [];
    for (const sentence of sentences) {
      clips.push(await speak(sentence, { speaker, pace, cacheDir: CACHE }));
    }
    const total =
      clips.reduce((sum, clip) => sum + clip.seconds, 0) + GAP * Math.max(0, clips.length - 1);
    last = { clips, pace };
    if (total <= window) return last;
  }

  // Nothing fitted, so the fastest attempt is the closest we have.
  if (!last) throw new Error('a beat produced no audio');
  return last;
}

function toSrt(cues: Cue[]): string {
  return cues
    .map((cue, index) => `${index + 1}\n${clock(cue.start)} --> ${clock(cue.end)}\n${cue.text}\n`)
    .join('\n');
}

function ffmpeg(args: string[]): void {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    cwd: VIDEO,
    stdio: 'inherit',
  });
}

async function main(): Promise<void> {
  const speaker = flag('speaker', 'shubh');
  const beats = loadBeats();
  const videoSeconds = durationOf(SILENT);

  mkdirSync(CACHE, { recursive: true });
  process.stdout.write(`Narrating ${beats.length} beats with Sarvam bulbul:v3, voice ${speaker}\n`);

  const placed: Placed[] = [];
  for (const [index, beat] of beats.entries()) {
    // The last beat runs to the end of the video, not to its own mark.
    const nextStart = index === beats.length - 1 ? videoSeconds : beat.end;
    const window = nextStart - beat.start;
    const { clips, pace } = await speakBeat(beat.sentences, window, speaker);

    let at = beat.start;
    for (const [position, clip] of clips.entries()) {
      const sentence = beat.sentences[position];
      if (!sentence) continue;
      placed.push({ clip, at, text: sentence });
      at += clip.seconds + GAP;
    }

    const used = at - GAP - beat.start;
    const fits = used <= window;
    process.stdout.write(
      `  ${fits ? 'ok  ' : 'OVER'} ${beat.label.padEnd(38).slice(0, 38)} ` +
        `window ${window.toFixed(1)}s  speech ${used.toFixed(1)}s  pace ${pace}\n`,
    );
  }

  const cues: Cue[] = [];
  for (const item of placed) {
    const chunks = toChunks(item.text);
    const words = chunks.map((chunk) => chunk.split(' ').length);
    const totalWords = words.reduce((sum, count) => sum + count, 0);
    let offset = item.at;
    for (const [index, chunk] of chunks.entries()) {
      const share = (words[index] ?? 1) / totalWords;
      const length = item.clip.seconds * share;
      cues.push({ start: offset, end: offset + length, text: wrap(chunk) });
      offset += length;
    }
  }

  writeFileSync(path.join(VIDEO, 'skillproof-demo.srt'), toSrt(cues), 'utf8');

  const inputs = placed.flatMap((item) => ['-i', path.relative(VIDEO, item.clip.file)]);
  const delays = placed
    .map((item, index) => {
      const ms = Math.round(item.at * 1000);
      return `[${index + 1}:a]adelay=${ms}|${ms}[a${index}]`;
    })
    .join(';');
  const mixInputs = placed.map((_, index) => `[a${index}]`).join('');
  // Sarvam returns mono at whatever level it likes, so the mix is levelled to
  // the usual -16 LUFS for video and widened to stereo inside the same graph.
  const graph =
    `${delays};${mixInputs}amix=inputs=${placed.length}:normalize=0,` +
    'loudnorm=I=-16:TP=-1.5:LRA=11,aformat=channel_layouts=stereo[mix]';

  ffmpeg([
    '-i',
    'skillproof-demo.mp4',
    ...inputs,
    '-filter_complex',
    graph,
    '-map',
    '0:v',
    '-map',
    '[mix]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-shortest',
    'narrated-no-subs.mp4',
  ]);

  const images = await renderCaptions(
    cues.map((cue) => cue.text),
    FRAME,
    CAPTIONS,
  );

  // One overlay per cue, each switched on for exactly the window its audio fills.
  const overlayInputs = cues.flatMap((cue) => {
    const file = images.get(cue.text);
    if (!file) throw new Error(`no caption image for ${cue.text}`);
    return ['-i', path.relative(VIDEO, file)];
  });
  let stream = '[0:v]';
  const steps = cues.map((cue, index) => {
    const label = index === cues.length - 1 ? '[v]' : `[v${index}]`;
    const between = `between(t,${cue.start.toFixed(2)},${cue.end.toFixed(2)})`;
    const step = `${stream}[${index + 1}:v]overlay=0:0:enable='${between}'${label}`;
    stream = label;
    return step;
  });

  ffmpeg([
    '-i',
    'narrated-no-subs.mp4',
    ...overlayInputs,
    '-filter_complex',
    steps.join(';'),
    '-map',
    '[v]',
    '-map',
    '0:a',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '22',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-c:a',
    'copy',
    'burned.mp4',
  ]);

  // The burned in captions always show; this adds the same text as a track a
  // player can turn off, which is what YouTube and Drive pick up.
  ffmpeg([
    '-i',
    'burned.mp4',
    '-i',
    'skillproof-demo.srt',
    '-map',
    '0:v',
    '-map',
    '0:a',
    '-map',
    '1:s',
    '-c',
    'copy',
    '-c:s',
    'mov_text',
    '-metadata:s:s:0',
    'language=eng',
    'skillproof-demo-narrated.mp4',
  ]);

  for (const scratch of ['narrated-no-subs.mp4', 'burned.mp4']) {
    rmSync(path.join(VIDEO, scratch), { force: true });
  }

  const out = path.join(VIDEO, 'skillproof-demo-narrated.mp4');
  process.stdout.write(
    `\n${cues.length} subtitle cues in docs/video/skillproof-demo.srt\n` +
      `Narrated video: docs/video/skillproof-demo-narrated.mp4 (${durationOf(out).toFixed(1)}s)\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
