# Testing notes

What was checked against real data before deploying, and what it changed.

## Provider chain

`pnpm providers:check` calls each provider's models endpoint and then makes one
real JSON call. Result on 26 September 2026:

| Provider      | Model                       | Models endpoint                        | One call                 |
| ------------- | --------------------------- | -------------------------------------- | ------------------------ |
| Sarvam AI     | `sarvam-105b-conversations` | 2 models listed, id present            | ok in 564ms, 52 tokens   |
| Groq          | `openai/gpt-oss-120b`       | 11 models listed, id present           | ok in 641ms, 204 tokens  |
| Google Gemini | `gemini-3.8-flash`          | no models endpoint, checked by calling | ok in 7087ms, 133 tokens |

### Why the Sarvam model changed

The chain was first built on `sarvam-105b`. Measured on this workload with
`reasoning_effort: low`, that model still produced reasoning content and was
slow and highly variable:

| Model                       | Latency across four calls | Completion tokens | Reasoning emitted      |
| --------------------------- | ------------------------- | ----------------- | ---------------------- |
| `sarvam-105b`               | 1.9s, 6.4s, 24.4s         | 175 to 872        | 657 to 3320 characters |
| `sarvam-105b-conversations` | 0.28s, 0.52s, 0.56s       | 11 to 52          | none                   |

24.4 seconds exceeds the 20 second call timeout, so the primary provider would
have fallen through to Groq on slow calls. Every call in this product is
structured extraction rather than open ended reasoning, so the conversations
variant of the same 105B family is the right default. `SARVAM_MODEL` overrides it.

## Real GitHub profiles

Full live analyses, resume text held constant so the differences come from code
evidence only.

| Profile                          | Target role        | Time  | Score | Repos | Observed role skills                                                                                                                          |
| -------------------------------- | ------------------ | ----- | ----- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `shubhamverma-devx`              | Frontend Developer | 7.4s  | 31.8  | 4     | JavaScript, HTML, CSS, React, Git, TypeScript, Tailwind CSS, Next.js, Accessibility, Vite, Authentication                                     |
| `shubhamverma-devx`              | ML Engineer        | 8.0s  | 5.1   | 4     | Git, Data visualisation                                                                                                                       |
| `gaearon`                        | Frontend Developer | 26.8s | 35.0  | 15    | JavaScript, HTML, CSS, React, Git, TypeScript, Tailwind CSS, Testing, Next.js, Node.js, Accessibility, Vite, Jest                             |
| `karpathy`                       | ML Engineer        | 22.2s | 32.5  | 15    | Python, Machine learning, Pandas, NumPy, Git, Statistics, Deep learning, PyTorch, Jupyter, Data visualisation, NLP, REST APIs, FastAPI, Linux |
| `this-user-should-not-exist-9x7` | ML Engineer        | 1.7s  | 1.6   | 0     | none, resume only path                                                                                                                        |

Observations that held up:

- The same profile scores 31.8 for Frontend and 5.1 for ML Engineer. The score is
  role relative, which is the whole point of weighting by job description demand.
- The missing user degrades in 1.7 seconds with a warning on the trace and a
  banner on the dashboard, and the analysis still completes on resume evidence.
- Every observed skill cites a real file: `Python <- pyproject.toml in nanochat`,
  `CSS <- app/global.css in overreacted.io`.

### Bug found and fixed: concepts had no evidence path

Karpathy first scored 27.0 with **Machine learning as his largest gap**, which is
plainly wrong. Concepts such as machine learning have no dependency to detect, so
they were only found when a README happened to use the exact phrase.

Fix: the taxonomy now carries an `implies` list, and a tool counts as evidence of
the concept behind it. PyTorch in a manifest is deep learning and machine
learning work whether or not the README says so. Sixteen skills carry
implications, all cases where the tool cannot be used without the concept:
PyTorch, TensorFlow, scikit-learn, MLflow, Terraform, Ansible, Prometheus,
Grafana, Power BI, Tableau, Matplotlib, GitHub Actions, Jenkins, Kubernetes,
Jest, Playwright.

Result: Karpathy 27.0 to 32.5, Machine learning now observed with
`pyproject.toml in nanochat` as its proof, and his top gaps become scikit-learn,
SQL, Data cleaning and TensorFlow, which are defensible for his public work.

Regression tests added in `tests/detect.test.ts`: implication produces the
concept with the implying file as the source, an empty repository implies
nothing, and direct evidence wins over implied evidence when both exist.

### Not bugs, checked and left alone

- `JavaScript` appears as a top gap for `gaearon` even though it is observed.
  Observed only evidence is worth 0.5 proficiency, and JavaScript carries 0.94
  demand, so its remaining gap weight is genuinely the largest number on the
  board. With a real resume claiming JavaScript it would drop.
- `REST APIs` is observed for `karpathy` through the `requests` dependency. That
  is evidence of working with HTTP APIs, which is what the skill covers.

## Demo cache

Recorded from Sarvam with `DEMO_MODE=true`, then replayed with every provider key
removed from the environment:

- 21 cached responses served, 0 live calls, 0 deterministic fallbacks.
- Score history identical to the live run: 46.6, 49.5, 49.3, 49.3, 49.3, 56.3,
  58.0, 61.7.
- The roadmap cache key includes a signature of the gap set, so a replan does not
  replay the first plan.
- The cache is imported statically so the bundler traces it into a serverless
  build, which means `pnpm demo:record` has to be followed by `pnpm build`.

### Bug found and fixed: roadmap JSON shape

Roadmap generation failed on all three providers, each returning `proof_project`
as a string rather than an object. The prompt listed the field names but never
showed the nested shape. Adding a complete worked example to the system prompt
fixed it on the first attempt, and the prompt was also cut from about 2,800
tokens to well under Groq's 8,000 token per minute free tier budget by sending
only the gaps that fit the horizon and bare resource URLs rather than titles.

## Supabase

Project `skillproof` in South Asia (Mumbai), schema applied with
`supabase db push` from `supabase/migrations/`.

Full storyline against Postgres rather than the local JSON store: 8 score history
rows, 3 verified skills, roadmap version 4 with 8 items, all surviving a reload.

### Bug found and fixed: Next.js cached every database read

The first run against Supabase looked like this: the quiz endpoints returned
correct new scores, but `GET /api/profile/:id` kept returning the state from
immediately after the analysis. Score history stayed at one row and the roadmap
never appeared.

Next.js patches global `fetch` and caches GET requests by default. The Supabase
client uses `fetch` underneath, so every read was served from the framework data
cache while the writes landed correctly in Postgres. The local JSON store never
touches `fetch`, which is why this only surfaced once a real database was
attached, and it would have shipped straight to production.

Fix: the Supabase client is constructed with its own `fetch` that passes
`cache: 'no-store'`. After the fix the same run produced the full history
`46.6, 49.5, 49.3, 49.3, 49.3, 57.8, 59.5, 63.2` and all three verified skills.

## Cost of one demo run

Measured on Sarvam with a profile that bypasses the demo cache, so every call was
live. Token totals reported by the API:

| Call                               | Tokens    |
| ---------------------------------- | --------- |
| Resume extraction                  | 1,362     |
| Roadmap generation                 | 4,527     |
| Quiz, four questions               | 1,427     |
| **Analysis, roadmap and one quiz** | **7,316** |

A full demo storyline adds two more quizzes and three replanned roadmaps, which
comes to roughly 24,000 tokens end to end. The demo profile replays from
`data/demo/llm_cache.json`, so the recorded demo costs nothing to run again.

## Pitch deck

`pnpm deck` builds `docs/SkillProof_Pitch.pptx` from `scripts/deck-content.ts`,
using the app's colour tokens, the real product seal and screenshots captured by
`pnpm demo:shots`. Checked by converting to PDF with LibreOffice and rendering
every page:

- **Slide size was wrong.** `LAYOUT_16x9` in pptxgenjs is 10 by 5.625 inches, not
  13.33 by 7.5. Everything laid out past those bounds was silently clipped, which
  cut the right hand column off every screenshot slide. Fixed with `LAYOUT_WIDE`.
- **Screenshots overlapped the bullet column.** The image box is now sized to the
  exact 1440 by 900 ratio of the captures instead of relying on the renderer.
- **Brand fonts were substituted with a serif.** A pptx carries one font name per
  run with no fallback list, so Schibsted Grotesk and IBM Plex Sans became Frank
  Ruhl on a machine without them. The deck uses Arial, which exists on macOS,
  Windows and in Office, so it renders the same everywhere. The brand carries
  through colour, layout and the seal instead.
- Table rows were raised so the table slides are not top heavy.

`docs/SkillProof_Pitch.pdf` is exported from the same file for anyone without
PowerPoint.

## Production smoke test

`pnpm smoke` checks the things that break in production but not locally: a cold
landing page, the storage banner, the analyse stream producing its first event
quickly, a quiz round trip, roadmap generation, reads reflecting writes, and a
live GitHub analysis. Against a local production build:

| Check                                        | Time     |
| -------------------------------------------- | -------- |
| Landing page                                 | 41ms     |
| Demo profile analysis, stream to dashboard   | 8,964ms  |
| Quiz round trip                              | 1,537ms  |
| Roadmap generation                           | 6,344ms  |
| State after writes                           | 1,491ms  |
| Live GitHub analysis for `shubhamverma-devx` | 14,798ms |

The slowest step is 14.8 seconds, comfortably inside the 60 second function
limit. Deployed timings are recorded below once the deployment exists.

Recorded in the "Production" section below once the deployment exists.
