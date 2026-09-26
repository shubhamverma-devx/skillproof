# Pitch deck content

Ten slides, ready to paste. Keep one idea per slide and let the screenshots do
the talking. Screenshots live in `docs/screenshots/`.

---

## Slide 1, title

**SkillProof**
Skills proven, not claimed.

An AI career agent that turns a student profile into a measurable readiness score
and an adaptive roadmap backed by evidence.

Bit N Build 2026, UP Regionals. Problem statement 05, education and employability.

---

## Slide 2, the problem

- A student knows the role they want. They do not know which skills they are
  missing for it.
- Resumes are self reported. A listed skill and a proven skill look identical on
  paper.
- Roadmaps are generic. The same eight week plan is handed to a student who has
  shipped four projects and to one who has shipped none.
- The result: months spent on the wrong skill, and a portfolio that does not
  answer the question a recruiter is actually asking.

---

## Slide 3, why existing tools fall short

| Tool | What it does | What it misses |
| --- | --- | --- |
| Course platforms | Sell a fixed syllabus | No idea what you already know |
| Resume scanners | Match keywords to a job description | Trusts the resume completely |
| A chatbot | Writes a plausible roadmap | No evidence, no score, no memory, invented links |
| Placement portals | List openings | Never say what you are missing for them |

None of them can answer "prove it".

---

## Slide 4, our solution

Four steps, all visible to the student:

1. **Collect evidence.** Resume gives claimed skills. GitHub code gives observed
   skills, traced to the exact file. An adaptive quiz gives verified skills.
2. **Price the gaps.** Every role carries a skill demand table built from job
   descriptions. Readiness is the demand weighted share you can prove.
3. **Plan.** Gaps ordered by readiness cost, sequenced by prerequisite, packed
   into your weekly hours, each ending in a proof project.
4. **Replan.** Every proof recalculates the score and rebuilds the weeks you have
   not touched.

---

## Slide 5, key features

- **Evidence levels:** claimed, observed, verified. Shown as badges everywhere.
- **Readiness score 0 to 100,** weighted by real job description frequency.
- **Explainable gaps:** "Docker appears in 46% of ML Engineer listings, not found
  in any of your 9 repositories, not claimed on your resume."
- **Proof projects:** three to five acceptance criteria, usually covering two gaps
  at once.
- **Human in the loop:** approve, reorder, edit, skip, change hours, or say "I
  already know this" and prove it with a quiz.
- **Adaptive replanning** with a visible "what changed" diff.
- **Agent trace:** every step, including every failure and fallback.

---

## Slide 6, architecture

`Next.js 14 App Router` front end, server routes, deterministic agent core.

- **Ingestion:** resume text or PDF, GitHub REST (repos, languages, file tree,
  manifests, README).
- **Detection:** taxonomy of 84 skills with aliases and code hints. Deterministic,
  no model needed.
- **Scoring:** proficiency rules and the readiness formula, in plain TypeScript.
- **Planning:** gap ranking, prerequisite graph, hour budget packer, resource
  whitelist, proof project blueprints.
- **Model layer:** Anthropic first, Gemini second, deterministic logic last.
  Every reply is validated with zod and repaired once before the chain moves on.
- **Storage:** Supabase Postgres, or a local JSON store when there are no
  credentials.

Show the Mermaid diagram from the README here.

---

## Slide 7, tech stack

- Next.js 14, TypeScript strict, Tailwind CSS with a custom token system
- shadcn/ui style components on Radix primitives, Recharts, lucide-react
- Supabase Postgres, `@supabase/supabase-js`, server side only
- `@anthropic-ai/sdk` with a Google Gemini fallback, zod at every boundary
- Vitest, ESLint, Prettier, GitHub Actions, deployed on Vercel

---

## Slide 8, innovation

- **The score is deterministic; the model only writes prose.** A hallucination can
  produce a bad sentence, never a bad number.
- **Evidence beats self assessment.** Marking a roadmap item done does not raise
  the score. Linking the repository does.
- **Every learning link is whitelisted.** The model chooses from a curated list, and
  anything outside it is dropped after validation.
- **The agent shows its failures.** The trace panel is part of the product, not a
  debug tool.
- **The whole product runs with zero API keys,** because every model step has a
  deterministic fallback.

---

## Slide 9, impact and scalability

- For a student: one number to argue with, a ranked list of what to fix, and a
  portfolio project per gap instead of another certificate.
- For a placement cell: the same engine aggregated over a cohort shows exactly
  where training should go.
- Cost: the expensive path is optional. Detection, scoring and planning are free
  and run per request in milliseconds.
- Scale: stateless routes, one Postgres table set, cached GitHub scans, and a
  dataset pipeline that takes new job descriptions as plain text files.

---

## Slide 10, demo and future scope

**Demo storyline:** readiness 47, Python verified at 100%, SQL claimed but 25%
under questioning, roadmap approved, a real repository linked, readiness 62.

**Next:**

- Live job description ingestion from LinkedIn and Naukri through the existing
  pipeline
- College placement cell dashboard with cohort level gap analysis
- Hindi and regional language interface
- Mentor review as a fourth evidence level above verified
- Automatic proof project checking against the acceptance criteria
