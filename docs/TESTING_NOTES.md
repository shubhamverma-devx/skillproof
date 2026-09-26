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

## Production smoke test

Recorded in the "Production" section below once the deployment exists.
