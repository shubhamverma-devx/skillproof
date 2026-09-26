# SkillProof design tokens

Concept: **proof ledger**. The product exists to separate claimed skills from proven
ones, so the interface borrows from verified documents: cool paper background,
deep navy ink, one confident cobalt for action and verification, and a single
bold element (the Proof Meter) that carries all the visual weight.

Everything below is implemented in `app/globals.css` (CSS variables) and
`tailwind.config.ts` (token names). UI code uses token names only, never raw hex.

## Colour

All tokens are stored as space separated RGB triplets so Tailwind can apply alpha
(`bg-verified/12`, `border-ink/10`).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#EEF1F6` | `#0E1330` | Page background (cool paper / real navy) |
| `surface` | `#FFFFFF` | `#161C3F` | Panels, rows, popovers |
| `ink` | `#1B2240` | `#E8ECF8` | Primary text, borders via alpha |
| `muted` | `#5E6785` | `#9AA3C2` | Secondary text, axis labels |
| `primary` | `#2F4BFF` | `#6A82FF` | Buttons, links, focus ring |

### Evidence scale (used identically everywhere)

| Level | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `claimed` | `#D99A1E` | `#F0BA4A` | On the resume only |
| `observed` | `#14907F` | `#2DBEA8` | Found in GitHub code |
| `verified` | `#2F4BFF` | `#7C91FF` | Passed the quiz |
| `missing` | `#C9CEDA` | `#4A5378` | No evidence at all |

Badge text uses the `-ink` variant of each hue (`claimed-ink`, `observed-ink`,
`verified-ink`) so 12px to 14px labels clear WCAG AA against a 12% tint.

## Typography

- Display and headings: **Schibsted Grotesk** 600/700, loaded with `next/font`.
- Body and UI: **IBM Plex Sans** 400/500.
- Numbers (score, percentages, hours) use `font-variant-numeric: tabular-nums`
  via the `.tabular` utility, so counting animations do not shift layout.
- Scale: 14 / 16 / 20 / 28 / 40 / 64 px, exposed as `text-ui-sm`, `text-ui`,
  `text-h3`, `text-h2`, `text-h1`, `text-display`.
- Sentence case everywhere. Body copy capped at 70ch.

## Shape and depth

- Radius: `rounded-panel` (14px) for page level panels, `rounded-inner` (8px)
  for controls and rows, `rounded-full` only for badges and the meter caps.
- Borders carry structure: 1px `border-ink/10` (light) and `border-ink/15`
  (dark). One shadow level (`shadow-overlay`) exists and is reserved for
  popovers and dialogs.

## Signature element: the Proof Meter

One horizontal bar, one segment per role skill, segment width proportional to
that skill's JD frequency, fill colour the evidence level and fill fraction the
proficiency. The readiness score sits beside it at `text-display`.

- On dashboard load: segments fill left to right over 900ms, score counts up.
- After a replan: segments animate from the previous state and the delta
  (for example `+15`) fades in once.
- `prefers-reduced-motion: reduce` renders the final state immediately.
- No other decorative motion exists in the product.

Verified skills carry the proof seal: a 1.5px ring with a check, drawn as inline
SVG in `components/proof-seal.tsx` and reused as the product mark.

## Layout

- Dashboard: two columns at `lg` and above. Left holds the Proof Meter, top gaps
  and the skills table; the narrow right column holds the score history chart
  and the Agent Trace. Single column below `lg`.
- Roadmap: a vertical week timeline. Items are expandable list rows, not a grid
  of identical cards.
- Page gutter: 16px at 360px, 24px at `sm`, 40px at `lg`. Content max width
  1280px.

## Deliberately avoided

Gradient washes, glow, purple to blue gradients, ALL CAPS eyebrows, dotted meta
strings, arrows inside button labels, fade up on every section, hover lift on
every card, one headline word in another colour, emoji, stock illustration.

## Accessibility floor

Usable at 360px, visible `focus-visible` ring in both themes, AA contrast for
text and UI borders, reduced motion respected, every colour coded state also
carries a text label.
