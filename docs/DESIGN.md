# SkillProof design system

The product tells a student something uncomfortable: most of what you claim is
unproven. That only lands if the interface is calm, plain and confident. So the
system is a neutral grayscale foundation, one accent, and colour used only where
it carries meaning.

Everything here is implemented in `app/globals.css` (tokens) and
`tailwind.config.ts` (names). Components reference token names, never raw hex.

## Principles

1. **One question per screen.** Every page answers a single question and offers
   a single primary action.
2. **Numbers never travel alone.** Every figure is followed by a sentence in
   plain English saying what it means.
3. **Colour means status, nothing else.** Decoration is grayscale.
4. **Say it the way a student would.** No internal vocabulary in the interface.

## Language

The code keeps its names. The interface does not use them.

| In code          | On screen                                           |
| ---------------- | --------------------------------------------------- |
| claimed          | On your resume                                      |
| observed         | Seen in your code                                   |
| verified         | Tested                                              |
| missing          | Not shown yet                                       |
| jd_frequency     | Asked in 62% of jobs                                |
| readiness score  | Job readiness                                       |
| evidence ceiling | You could reach 89 by proving what you already know |
| agent trace      | How we worked this out                              |
| proficiency      | How much of it you have shown                       |
| gap              | What is missing                                     |

## Type

**Geist Sans** for everything, **Geist Mono** for figures inside dense rows.
Loaded through the `geist` package, so there is no network font fetch at build.

| Token          | Size | Use                              |
| -------------- | ---- | -------------------------------- |
| `text-xs`      | 12   | Meta, table headers              |
| `text-sm`      | 14   | Body in dense UI, secondary text |
| `text-base`    | 16   | Body                             |
| `text-lg`      | 20   | Card titles                      |
| `text-xl`      | 24   | Page titles                      |
| `text-2xl`     | 32   | Section headlines                |
| `text-display` | 48   | The score, once per screen       |

Headings are semibold, never bold-black. Numbers use tabular figures through the
`.tabular` utility so counting animations do not shift layout. Body copy is
capped at 68 characters.

## Colour

Grayscale foundation, one accent, status colours desaturated so a screen full of
badges still reads as calm.

| Token            | Light     | Dark      | Use                                     |
| ---------------- | --------- | --------- | --------------------------------------- |
| `canvas`         | `#FAFAFA` | `#0B0C0E` | Page background                         |
| `surface`        | `#FFFFFF` | `#141517` | Cards, sheets, rows                     |
| `surface-raised` | `#FFFFFF` | `#1B1D20` | Sheets and menus above a card           |
| `line`           | `#E7E7E9` | `#26282C` | 1px borders, the main structural device |
| `ink`            | `#18181B` | `#F4F4F5` | Primary text                            |
| `ink-muted`      | `#6B6F76` | `#9CA1A9` | Secondary text                          |
| `ink-faint`      | `#9096A0` | `#71767E` | Meta text, axis labels                  |
| `accent`         | `#3355FF` | `#6E86FF` | Primary action, focus ring, the score   |

### Status colours

Used only to mean one of the four proof states, and only on small elements.

| State    | On screen         | Light     | Dark      |
| -------- | ----------------- | --------- | --------- |
| verified | Tested            | `#2F6F4F` | `#6FC194` |
| observed | Seen in your code | `#2D5B8C` | `#78ACE0` |
| claimed  | On your resume    | `#8A6420` | `#D8AA5C` |
| missing  | Not shown yet     | `#8A8F98` | `#787D85` |

Each has a `-soft` background token at roughly 10 percent for badge fills. All
combinations were checked for WCAG AA against their background.

## Space and shape

- Strict 4px grid. Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64.
- Page gutter: 16px at 360px, 24px at `sm`, 32px at `lg`.
- Main content max width 1120px.
- Radius: 12px panels, 8px controls and rows, full for pills.
- Borders carry structure. One shadow level exists, `shadow-overlay`, used only
  on sheets, menus and tooltips.

## Layout

After onboarding the product lives in an app shell.

- **Desktop:** a 240px left sidebar with the mark, four sections (Overview,
  Skills, Roadmap, Progress), and the student's name, target role and theme
  toggle pinned at the bottom.
- **Mobile:** a top bar with the page title and a bottom tab bar with the same
  four sections, thumb reachable.
- Every page has a title and one line saying what it shows.

## Motion

- 150ms to 250ms, ease-out. Hover and focus transitions only on colour.
- Two signature moments survive: the meter filling with the score counting up on
  first load, and the meter animating from old to new after a replan.
- `prefers-reduced-motion: reduce` renders the end state immediately.

## Components

Buttons (primary, secondary, ghost, danger in three sizes), input, textarea,
select, slider, tabs, badge, panel, side sheet, dialog, tooltip, toast,
skeleton, empty state, stat tile. Every interactive element has hover,
focus-visible, active and disabled states.

## Charts

Clean axes, no gridline noise, labels in `ink-faint`, hover tooltips that read as
sentences rather than key and value pairs. Nothing is coloured unless the colour
means something.

## Deliberately avoided

Gradient washes, glassmorphism, ALL CAPS eyebrows, emoji, rainbow badges, every
section in an identical card, centred body text, one word of a headline in a
different colour, stock illustration, fake testimonials, fake logos, fake counts.
