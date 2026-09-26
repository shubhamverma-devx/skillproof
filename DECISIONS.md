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
