/**
 * Builds docs/SkillProof_Pitch.pptx from scripts/deck-content.ts.
 *
 *   pnpm deck
 *   LIVE_URL=https://... REPO_URL=https://... pnpm deck
 *
 * Colours, type and the seal come from the same tokens as the app, so the deck
 * and the product look like one thing. Screenshots are the real ones captured by
 * pnpm demo:shots.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import PptxGenJS from 'pptxgenjs';
import { LINKS, SLIDES, type Bullet, type Slide } from './deck-content';

const OUT = path.join(process.cwd(), 'docs', 'SkillProof_Pitch.pptx');
const SHOTS = path.join(process.cwd(), 'docs', 'screenshots', 'deck');
// Deliberately outside SHOTS: the demo recorder clears that folder on every run,
// which would otherwise delete this file and show up as repo churn.
const SEAL = path.join(process.cwd(), 'docs', 'screenshots', 'seal.png');

/** docs/DESIGN.md tokens. */
const C = {
  paper: 'EEF1F6',
  surface: 'FFFFFF',
  ink: '1B2240',
  muted: '5E6785',
  primary: '2F4BFF',
  claimed: 'D99A1E',
  observed: '14907F',
  line: 'D7DCE6',
} as const;

/**
 * A pptx carries one font name per run with no fallback list, so a brand font
 * the viewer does not have is substituted by whatever the renderer picks, which
 * on a fresh machine means a serif. Arial is present on macOS, Windows and in
 * Office, so the deck looks the same for everyone. The brand comes through in
 * the colour, the layout and the seal instead.
 */
const FONT = { display: 'Arial', body: 'Arial' } as const;
const W = 13.33;
const H = 7.5;

/** Rasterises the product mark so the deck carries the same seal as the app. */
async function renderSeal(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 256, height: 256 } });
  await page.setContent(
    `<body style="margin:0;background:transparent">
      <svg width="256" height="256" viewBox="0 0 24 24" fill="none" stroke="#2F4BFF">
        <circle cx="12" cy="12" r="9.25" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="6.25" stroke-width="0.75" opacity="0.45"/>
        <path d="M8.5 12.2 11 14.6l4.6-5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </body>`,
  );
  await page.screenshot({ path: SEAL, omitBackground: true });
  await browser.close();
}

type Deck = InstanceType<typeof PptxGenJS>;
type Slidely = ReturnType<Deck['addSlide']>;

function frame(slide: Slidely, title: string, lead?: string): void {
  slide.addImage({ path: SEAL, x: 0.55, y: 0.42, w: 0.36, h: 0.36 });
  slide.addText('SkillProof', {
    x: 1.0,
    y: 0.42,
    w: 3,
    h: 0.36,
    fontFace: FONT.display,
    fontSize: 14,
    bold: true,
    color: C.ink,
    valign: 'middle',
  });
  slide.addText(title, {
    x: 0.55,
    y: 1.1,
    w: W - 1.1,
    h: 0.7,
    fontFace: FONT.display,
    fontSize: 34,
    bold: true,
    color: C.ink,
  });
  if (lead) {
    slide.addText(lead, {
      x: 0.55,
      y: 1.85,
      w: W - 2.4,
      h: 0.6,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.muted,
    });
  }
}

function bulletBlock(slide: Slidely, bullets: Bullet[], x: number, y: number, w: number): void {
  bullets.forEach((bullet, index) => {
    const top = y + index * 1.05;
    slide.addShape('rect', { x, y: top + 0.14, w: 0.09, h: 0.44, fill: { color: C.primary } });
    slide.addText(bullet.text, {
      x: x + 0.28,
      y: top,
      w,
      h: 0.36,
      fontFace: FONT.display,
      fontSize: 17,
      bold: true,
      color: C.ink,
    });
    if (bullet.note) {
      slide.addText(bullet.note, {
        x: x + 0.28,
        y: top + 0.36,
        w,
        h: 0.5,
        fontFace: FONT.body,
        fontSize: 13,
        color: C.muted,
      });
    }
  });
}

function titleSlide(slide: Slidely): void {
  slide.background = { color: C.ink };
  slide.addImage({ path: SEAL, x: 0.9, y: 1.5, w: 1.1, h: 1.1 });
  slide.addText('Skills proven, not claimed.', {
    x: 0.9,
    y: 2.9,
    w: 11,
    h: 1.1,
    fontFace: FONT.display,
    fontSize: 52,
    bold: true,
    color: 'FFFFFF',
  });
  slide.addText(
    'SkillProof turns a student profile into a measurable readiness score and an adaptive roadmap, with the evidence behind every number.',
    { x: 0.9, y: 4.1, w: 8.8, h: 1.1, fontFace: FONT.body, fontSize: 16, color: 'AEB7D6' },
  );
  slide.addText(
    'Bit N Build 2026, UP Regionals  |  Problem statement 05, education and employability',
    {
      x: 0.9,
      y: 6.3,
      w: 11,
      h: 0.4,
      fontFace: FONT.body,
      fontSize: 13,
      color: '8A93B8',
    },
  );
}

function shotSlide(slide: Slidely, data: Extract<Slide, { kind: 'shot' }>): void {
  frame(slide, data.title, data.lead);
  // The screenshots are 1440 by 900, so the box keeps that ratio exactly rather
  // than leaving the renderer to letterbox it into a mismatched frame.
  slide.addImage({ path: path.join(SHOTS, data.image), x: 0.55, y: 2.65, w: 7.2, h: 4.5 });
  bulletBlock(slide, data.bullets, 8.15, 2.8, 4.5);
}

function tableSlide(slide: Slidely, data: Extract<Slide, { kind: 'table' }>): void {
  frame(slide, data.title, data.lead);
  slide.addTable(
    [
      data.head.map((cell) => ({
        text: cell,
        options: { bold: true, color: C.ink, fill: { color: C.paper }, fontFace: FONT.display },
      })),
      ...data.rows.map((row) =>
        row.map((cell) => ({ text: cell, options: { color: C.muted, fontFace: FONT.body } })),
      ),
    ],
    {
      x: 0.55,
      y: data.lead ? 2.7 : 2.4,
      w: W - 1.1,
      fontSize: 13,
      border: { type: 'solid', color: C.line, pt: 1 },
      rowH: 0.72,
      valign: 'middle',
      margin: 10,
    },
  );
}

function closingSlide(slide: Slidely, data: Extract<Slide, { kind: 'closing' }>): void {
  frame(slide, data.title);
  bulletBlock(slide, data.bullets, 0.55, 2.3, 11.5);
  slide.addShape('rect', { x: 0.55, y: 5.9, w: W - 1.1, h: 0.03, fill: { color: C.line } });
  slide.addText(
    [
      { text: 'Live demo  ', options: { color: C.muted } },
      { text: LINKS.live, options: { color: C.primary, bold: true } },
      { text: '\nSource  ', options: { color: C.muted } },
      { text: LINKS.repo, options: { color: C.primary, bold: true } },
    ],
    {
      x: 0.55,
      y: 6.1,
      w: 11.5,
      h: 0.9,
      fontFace: FONT.body,
      fontSize: 14,
      lineSpacingMultiple: 1.3,
    },
  );
}

async function main(): Promise<void> {
  await mkdir(path.dirname(OUT), { recursive: true });
  await renderSeal();

  const pptx = new PptxGenJS();
  // LAYOUT_16x9 is 10 by 5.625 inches in pptxgenjs. LAYOUT_WIDE is the 13.33 by
  // 7.5 inch slide these coordinates are drawn for.
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'SkillProof';
  pptx.title = 'SkillProof';

  for (const data of SLIDES) {
    const slide = pptx.addSlide();
    slide.background = { color: C.surface };

    if (data.kind === 'title') titleSlide(slide);
    else if (data.kind === 'shot') shotSlide(slide, data);
    else if (data.kind === 'table') tableSlide(slide, data);
    else if (data.kind === 'closing') closingSlide(slide, data);
    else {
      frame(slide, data.title, data.lead);
      bulletBlock(slide, data.bullets, 0.55, 2.7, 11.5);
    }
  }

  await pptx.writeFile({ fileName: OUT });
  process.stdout.write(`${SLIDES.length} slides written to docs/SkillProof_Pitch.pptx\n`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
