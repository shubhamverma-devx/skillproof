# UX audit, before the redesign

Walked through every screen as a second year student who has never heard of
"evidence levels" or "JD frequency". Screenshots this is based on are in
`docs/redesign/before/`, captured at 1440px and 390px in both themes, using the
demo profile and a GitHub only profile.

The test applied to every screen: in five seconds, can the student say what this
screen is, what it means for them, and what to do next.

---

## Screen by screen

### Landing page

**What is it for?** Clear enough. The headline says what the product claims.

**One thing to do next?** Yes, "Analyse my profile". Reasonable.

**Problems**

- No picture of the product. A student cannot tell what they will get.
- "5 roles, 100 job descriptions, 84 skills in the taxonomy" is the first line on
  the page. Taxonomy is our word, not theirs.
- No explanation of how it works or what the three kinds of proof are, which is
  the entire idea of the product.
- No answer to the obvious questions: is this free, where does the job data come
  from, what happens to my resume.

### Onboarding

**What is it for?** Clear. "Set up your analysis", three steps.

**One thing to do next?** Yes, though "Continue" is disabled until a role is
picked with no explanation of why.

**Problems**

- "24 skills from 20 listings" on every role card is our internal framing.
- No progress indicator beyond three small numbers, and no sense of how long it
  takes.
- No examples. The resume box is an empty rectangle with no hint of what good
  input looks like.
- The GitHub step says "(optional)" in the label but nothing explains what it
  buys the student, so most will skip the highest value input.

### Analysis screen

**What is it for?** Mostly clear, something is working.

**Problems**

- Steps are written for an engineer: "Resume parsed", "Code evidence complete",
  "Model output validated". One line says "Deterministic fallback: No model
  output for demo:resume, using built in logic instead", which is meaningless
  and slightly alarming to a student.
- No progress bar, so there is no sense of how long is left.

### Dashboard

**What is it for?** Not clear in five seconds. It opens with a number, 47, with
no sentence saying what that number means or what to do about it.

**One thing to do next?** No. There are twenty six competing actions on the page:
"Build my roadmap" plus one "Verify X" button on every skill row.

**Problems**

- Every label is internal vocabulary: Readiness, Proof Meter, Claimed, Observed,
  Verified, Agent trace, "Segment width is how often job descriptions ask for
  the skill", "Ranked by job description demand multiplied by how much of the
  skill is still unproven".
- Six panels of equal visual weight. Nothing says which one matters.
- The skills table puts all twenty four rows inline with no grouping, so the
  student scrolls a wall of near identical rows.
- On a phone the page is **13,510 pixels tall**. That is roughly fifteen screens
  of scrolling with no navigation to escape it.
- The agent trace, which is a debugging aid, is given the same prominence as the
  score.
- Two amber notices can stack above the score before the student reaches it.

### Skills

There is no skills page. Skills live inside the dashboard as a filtered table,
which is why the dashboard is so long.

### Roadmap

**What is it for?** Clear enough, a week by week plan.

**One thing to do next?** Competing: "Approve roadmap" and "Rebuild from current
gaps" sit next to each other, and rebuilding would throw away the plan.

**Problems**

- No sense of "what do I do this week". All eight weeks are equal.
- Opening an item dumps four sections of text inline, pushing everything else
  down the page.
- "Version 4, approved" is release vocabulary, not student vocabulary.
- The draft banner and the demo banner are the same colour and sit together.

### Progress

**What is it for?** Roughly clear.

**Problems**

- Four panels of identical weight, so the highest value action, linking a
  repository, does not stand out.
- The result of an action appears in a box above the fold that is easy to miss,
  and the wording is mechanical: "Readiness moved from 49.1 to 57.6 out of 100, a
  change of +8.5."

### Quiz

The clearest screen in the product. Problems are minor: the difficulty pill is
unexplained, and there is no indication of how long the quiz takes.

### GitHub only profile

The note is correct and useful. But the screen around it still uses the same
vocabulary, so a student who provided no usable resume sees a low number, three
unexplained colour words, and no obvious way to improve.

---

## The fifteen problems worth fixing, by impact

| #   | Problem                                                                                           | Why it matters                                                       |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | No navigation. Everything is one long page per profile                                            | On a phone the dashboard is fifteen screens tall with no way to jump |
| 2   | The score has no sentence explaining it                                                           | The single most important number in the product is unexplained       |
| 3   | No single next action. Twenty six buttons compete on the dashboard                                | A confused student does nothing                                      |
| 4   | Internal vocabulary everywhere: claimed, observed, verified, JD frequency, readiness, agent trace | The core idea is invisible behind our words                          |
| 5   | Twenty four skill rows inline with no grouping                                                    | Cannot answer "what have I proven" at a glance                       |
| 6   | Six panels of equal weight on the dashboard                                                       | No hierarchy, so nothing reads as important                          |
| 7   | Roadmap has no "this week"                                                                        | The plan is a document, not something to act on                      |
| 8   | Item details are inline walls of text                                                             | Opening one item destroys the page layout                            |
| 9   | Analysis steps are written for engineers                                                          | First impression of the product is a log file                        |
| 10  | Landing page shows no product and explains no mechanism                                           | Visitors cannot tell what they are signing up for                    |
| 11  | Agent trace has the same prominence as the score                                                  | A debugging panel competes with the headline                         |
| 12  | Progress results are mechanical and easy to miss                                                  | The payoff moment of the whole product is underplayed                |
| 13  | No first visit explanation of the three proof types                                               | The central concept is never taught                                  |
| 14  | Onboarding gives no examples and no reason to connect GitHub                                      | The most valuable input is the easiest to skip                       |
| 15  | Evidence colours are highly saturated and used decoratively                                       | The interface feels noisy rather than calm                           |

## What is already good and should survive

- The Proof Meter is a genuinely distinctive way to show a weighted score. It
  needs explaining, not replacing.
- Every skill can be traced to a repository and a file. That is the product's
  best idea and it is buried one click deep.
- The "marking done does not move the score" moment is honest and sharp.
- Copy is already plain in places, for example the empty and error states.
