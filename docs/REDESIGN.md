# What changed in the redesign, and why

The product worked before this. It did not explain itself. A second year student
opening the old dashboard met a number with no sentence around it, four internal
words (claimed, observed, verified, JD frequency) that mean nothing outside this
repository, and eleven panels competing to be read first. On a phone that page
was 13,510 pixels tall.

`docs/UX_AUDIT.md` has the full walkthrough and the fifteen ranked problems. This
file records what was done about them. Before and after screenshots of every page
at both widths in both themes are in `docs/redesign/before` and
`docs/redesign/after`.

The scoring core, the agent pipeline, the API contracts, the database schema and
the rate limits were not touched. Everything below is presentation.

## The five decisions that mattered

### 1. The interface stopped using the code's vocabulary

`claimed`, `observed`, `verified` and `missing` are still the names in the
database and in `lib/scoring`. On screen they are now "On your resume", "Seen in
your code", "Tested" and "Not shown yet". `lib/wording.ts` is the single place
that maps one to the other, so a label cannot drift between two pages. Frequency
became "Asked in 62% of jobs". The agent trace became "How we worked this out".

Every number is now followed by a sentence saying what it means. The score reads
"You are 50% ready for ML Engineer roles" and directly under it "Most of your gap
is unproven, not unknown. You could reach 89 by proving skills you already have."

### 2. One page, one question, one primary button

The old dashboard was a list of everything the system knew. The four pages now
each answer one question: where do I stand (Overview), what does this role want
(Skills), what do I do in what order (Roadmap), what have I actually done
(Progress). `lib/next-step.ts` picks a single next action from the profile state
and the Overview renders it as the only accent coloured button on the page.

### 3. The product got a shell

After onboarding, everything lives inside an app shell: a 240px sidebar on
desktop, a bottom tab bar on the phone, the student's name and target role pinned
at the bottom, and a title plus one line of explanation on every page. Before
this, navigation was links inside the content.

### 4. Colour was taken away from decoration and given to status

The foundation is grayscale, one accent, and four status colours that only ever
mean a proof level. Full system in `docs/DESIGN.md`. Every text colour was
measured against every background it actually sits on rather than against white,
which caught three separate AA failures that a single check would have missed.

### 5. Nothing claims more than it knows

The meter legend says "Each block is a skill. Wider means more jobs ask for it."
The skills page ends with "Other things we found", listing what the scan picked up
that this role does not ask for, so those skills do not silently vanish. The
demo profile carries a banner saying it is a sample student replayed from a
recording. The landing page has no testimonials, no logos and no user counts,
because there are none.

## Page by page

| Page       | Before                                                           | After                                                                                                     |
| ---------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Landing    | Feature list, no product shot                                    | Hero with a real Overview screenshot in a browser frame, how it works in 3 steps, proof types, honest FAQ |
| Onboarding | One long form                                                    | Stepper, one question per step, helper text and an example on each, GitHub marked optional                |
| Overview   | Eleven panels, 13,510px on a phone                               | Headline sentence, meter, one next step, four counts, top 3 gaps, history and trace at the bottom         |
| Skills     | Did not exist; skills were rows on the dashboard                 | Grouped by proof, search and filters, demand bar per row, one action per row, evidence in a side sheet    |
| Roadmap    | Every week expanded, resources inline                            | This week focused at the top, later weeks collapsed, details in a sheet                                   |
| Progress   | Four controls with no explanation of what each does to the score | Four cards, each saying what it proves, and a result sentence naming the skill that moved                 |

## What the screenshot review caught

The review ran four times. Fixes that came out of it, in order:

1. The score history chart clipped its own y axis labels, so "100" rendered as
   ")0". The left margin was negative to save space it did not need.
2. The chart's x axis was the row index, so it read "1, 2". It now shows the day,
   or the clock when the whole history happened in one sitting.
3. The Overview showed three counts, which did not add up to the number of skills
   the role asks for, because skills that are only on the resume were in none of
   them. There are now four, and they sum to the total.
4. **The worst one.** Every skill row drew a bar next to the text "92% of jobs",
   and the bar was proficiency, not demand. A tested skill at 95% demand showed a
   full bar and an untested one at 92% showed a third of a bar, so the bar and the
   number sitting beside it disagreed. The bar is demand now.
5. Skill rows had no action, so the only way to act on a skill was to open the
   sheet first. Each row now ends in "Test this", "Add proof" or "Retake".
6. On a phone the row hid the demand entirely and truncated names to "Machine
   lear...". The bar is desktop only now, the phone shows the percentage under the
   name, and the badge is hidden there because the group heading above already
   says it.
7. The first visit tour could only decide whether to appear after reading
   localStorage, and it appeared in the flow, which pushed the score card down
   after the page had already painted. It floats above the page now.

## Numbers

| Measure                       | Before   | After   |
| ----------------------------- | -------- | ------- |
| Overview height at 390px      | 13,510px | 2,666px |
| Overview CLS (mobile)         | 0.19     | 0       |
| Overview performance (mobile) | 80       | 91      |
| Accessibility, every page     | 96       | 100     |
| Horizontal overflow at 360px  | yes      | none    |

Lighthouse was run on all six pages at both the desktop and the throttled mobile
preset. Every page scores at least 90 on performance, and 100 on both
accessibility and best practices. An axe sweep over six pages, two themes, two
widths and two scroll positions reports zero violations.

`pnpm test:journey` walks a first time user from the landing page through
onboarding, a test, roadmap approval and logging a project, and checks the score
moved, at 1440px and at 390px.
