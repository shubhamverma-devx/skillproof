/**
 * Renders each subtitle cue to a transparent PNG the size of the video frame.
 *
 * The ffmpeg on this machine is built without libass and without drawtext, so
 * there is no text filter to burn captions with. Playwright is already a
 * dependency and draws text far better than a filter would, so each cue is
 * rendered once and overlaid as an image.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';

export type Caption = { text: string; file: string };

const STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: transparent; }
  body {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 44px;
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
  }
  p {
    max-width: 68%;
    padding: 10px 18px;
    border-radius: 10px;
    background: rgba(12, 13, 15, 0.82);
    color: #fff;
    font-size: 27px;
    line-height: 1.38;
    font-weight: 500;
    text-align: center;
    text-wrap: balance;
    white-space: pre-line;
  }
`;

function page(text: string): string {
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;');
  return `<!doctype html><meta charset="utf-8"><style>${STYLE}</style><p>${safe}</p>`;
}

async function render(browser: Page, text: string, file: string): Promise<void> {
  await browser.setContent(page(text), { waitUntil: 'load' });
  await browser.screenshot({ path: file, omitBackground: true });
}

/** Renders every distinct cue once, cached by its text and the frame size. */
export async function renderCaptions(
  texts: string[],
  size: { width: number; height: number },
  cacheDir: string,
): Promise<Map<string, string>> {
  mkdirSync(cacheDir, { recursive: true });

  const wanted = new Map<string, string>();
  for (const text of texts) {
    const key = createHash('sha256')
      .update(`${size.width}x${size.height}|${STYLE}|${text}`)
      .digest('hex')
      .slice(0, 16);
    wanted.set(text, path.join(cacheDir, `${key}.png`));
  }

  const missing = [...wanted.entries()].filter(([, file]) => !existsSync(file));
  if (missing.length === 0) return wanted;

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
  const tab = await context.newPage();
  for (const [text, file] of missing) {
    await render(tab, text, file);
  }
  await browser.close();

  return wanted;
}
