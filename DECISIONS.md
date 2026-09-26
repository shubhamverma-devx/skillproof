# Decisions

Choices made while building, with the reason. Recorded as they happened.

## Stack and setup

- **Next.js 14.2 with React 18, not Next 15/16.** shadcn style components, Recharts
  and `pdf-parse` are all stable on this line, and the build had to be predictable
  under a hackathon deadline. Tailwind 3.4 for the same reason: Tailwind 4 changes
  the token pipeline this design system relies on.
- **shadcn/ui components are vendored by hand** into `components/ui` following the
  shadcn pattern (Radix primitive + `cva` variants + `cn`), rather than running the
  CLI. shadcn is copy-in-your-repo code by design, and writing the files directly
  kept the token system in `docs/DESIGN.md` authoritative instead of patching a
  generated theme afterwards.
- **pnpm installed to a user prefix** (`~/.npm-global`) because the global npm
  prefix on this machine is not writable.

## Data and persistence

- **One store interface, two implementations** (`lib/db/types.ts`). Supabase when
  both credentials exist, otherwise a JSON file store. The app therefore runs from
  a fresh clone with no cloud account, which is also the graceful failure path the
  problem statement asks for.
- **The JSON store serialises writes** through a promise queue and writes via temp
  file plus rename. Two concurrent requests would otherwise clobber each other's
  rows, which is easy to hit during a live demo.
- **No row level security and no auth.** The profile id in the URL is the
  capability. This is stated in the README rather than hidden, and it is why the
  service role key never leaves server code.

## LLM

- **Deterministic core, LLM at the edges.** Scoring, gap ranking and evidence
  detection are plain TypeScript. The model only writes prose (`why`), generates
  quiz questions and sequences the roadmap. A model that hallucinates cannot change
  a readiness score.
- **One entry point for every model call** (`lib/llm/index.ts`) so the fallback
  chain, the 20 second timeout and the trace logging cannot be bypassed:
  demo cache, then each configured provider with one repair retry carrying the zod
  error, then the caller's deterministic fallback.
- **Resources are whitelisted** in `data/resources.json`. The model picks from a
  list and any URL outside it is dropped after validation, because an invented
  learning link is the most likely visible hallucination in this product.

## Schema

- **`profiles.github_summary` was added to the given schema.** Evidence summaries
  say "not found in any of your 9 scanned repositories", and that count cannot be
  recovered from `skill_evidence`, which only records repositories that produced a
  hit. Storing a compact scan summary keeps the explanation honest and lets a
  replan run without touching the GitHub API again.

## Scoring and evidence

- **A failed quiz does not earn the verified badge, but it does set proficiency.**
  Taking a quiz and scoring 25% means the skill is genuinely weak, so the number
  drops and the badge stays at whatever the code and resume showed. A badge that
  meant "attempted" would be worth nothing.
- **Marking a roadmap item done never moves the score.** Self reported completion
  is exactly the kind of claim this product exists to distrust. Progress is
  recorded and the plan is replanned; the score moves when a repository or a quiz
  proves the skill. This is stated in the interface where the student does it.
- **README mentions count as evidence for concepts only.** There is no dependency
  that proves "feature engineering", so the README is the only available signal.
  Allowing it for tools as well would let a mention pass as an import.

## Roadmap

- **Items the student touched are locked.** Any edit, skip or status change sets
  `user_edited`, and later versions copy that item across unchanged. The agent
  replans the future, not the student's decisions.
- **Weeks are packed in order and never backfilled.** Leaving three hours unused in
  week one is cheaper than moving a skill ahead of its prerequisite to fill them.
- **Proof projects combine two gaps only when they meet.** Either the same skill
  category or a prerequisite relation. Forcing unrelated skills into one project
  produces something nobody would build.
- **Proof projects come from a curated blueprint per skill** rather than from the
  model alone, so the offline path produces the same quality as the online one.

## Testing

- **59 tests rather than the 20 originally planned.** Every deterministic rule that
  a judge might question has a test: the readiness formula, the proficiency table,
  the badge threshold, alias collisions such as "js" inside "Node.js", manifest
  parsing, the hour budget packer, the resource whitelist and the whole LLM
  fallback chain against a mocked provider. None of them restate the code.

## Model providers

Replaced the single Anthropic dependency with a free tier chain. What was
confirmed from the provider documentation before writing any adapter:

**Sarvam AI (primary), confirmed at docs.sarvam.ai**

- `POST https://api.sarvam.ai/v1/chat/completions`, OpenAI shaped.
- Auth is `Authorization: Bearer <key>`, with `api-subscription-key` as an
  alternative header.
- Chat models are `sarvam-105b` (128K context) and `sarvam-105b-conversations`
  (32K, tuned for voice and dialogue). **`sarvam-30b` and `sarvam-m` are
  deprecated and no longer served**, so there is no smaller Sarvam model to fall
  back to. A rate limited Sarvam call goes straight to Groq instead.
- `response_format` supports `json_object` and `json_schema`, so JSON mode is
  requested rather than asked for politely in the prompt.
- Reasoning is controlled by `reasoning_effort` (`low`, `high`, `max`, default
  `medium`). There is no off switch, so structured calls use `low`. Reasoning
  comes back in `message.reasoning_content` and is billed as completion tokens,
  which is why `max_tokens` has to cover both.
- Rate limit for the 105B model on the Starter plan is 40 requests a minute.
  Signup credits are worth 100 rupees across all Sarvam APIs and do not expire.

**Groq (first fallback), confirmed at console.groq.com/docs/rate-limits**

- OpenAI compatible at `https://api.groq.com/openai/v1`.
- `openai/gpt-oss-120b` on the free tier: 30 requests a minute, 8k tokens a
  minute, 1k requests a day. Rate limits return HTTP 429 with `retry-after`.
- That 8k tokens a minute is the tightest budget in the chain, so the resume
  prompt is capped at 6000 characters and READMEs are never sent to a model.

**Google Gemini (second fallback), confirmed at ai.google.dev**

- `gemini-3.8-flash` is the current generally available Flash model. The old
  `gemini-1.5-flash` id this project shipped with was out of date.

**Decisions that follow from this**

- **One adapter for Sarvam and Groq.** Both are OpenAI shaped, so a second copy
  of the same request code would only be a second place for bugs to live.
- **`@anthropic-ai/sdk` was removed outright** rather than kept behind an env
  flag. An unused SDK in the dependency list is a claim the project does not
  back up, and the chain already has three providers.
- **A rate limited provider is abandoned immediately.** Waiting out a free tier
  window would stall a request that has a working alternative one line down.
- **The chain order is data, not code.** `LLM_PRIMARY` promotes any configured
  provider to the front.
