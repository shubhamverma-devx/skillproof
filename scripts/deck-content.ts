/** Slide copy for the pitch deck, kept apart from the layout code. */

export const LINKS = {
  live: process.env.LIVE_URL ?? 'https://skillproof.vercel.app',
  repo: process.env.REPO_URL ?? 'https://github.com/shubhamverma-devx/skillproof',
};

export type Bullet = { text: string; note?: string };

export type Slide =
  | { kind: 'title' }
  | { kind: 'bullets'; title: string; lead?: string; bullets: Bullet[] }
  | { kind: 'table'; title: string; lead?: string; head: string[]; rows: string[][] }
  | { kind: 'shot'; title: string; lead: string; image: string; bullets: Bullet[] }
  | { kind: 'closing'; title: string; bullets: Bullet[] };

export const SLIDES: Slide[] = [
  { kind: 'title' },

  {
    kind: 'bullets',
    title: 'The problem',
    lead: 'A student knows the role they want. Nobody tells them what they are missing for it.',
    bullets: [
      {
        text: 'Resumes are self reported',
        note: 'a listed skill and a proven skill look identical on paper',
      },
      {
        text: 'Roadmaps are generic',
        note: 'the same eight week plan for a student with four shipped projects and one with none',
      },
      {
        text: 'Nothing is measurable',
        note: 'no number to argue with, so no way to know if this month helped',
      },
      {
        text: 'The result',
        note: 'months on the wrong skill, and a portfolio that does not answer the recruiter question',
      },
    ],
  },

  {
    kind: 'table',
    title: 'Why existing tools fall short',
    head: ['Tool', 'What it does', 'What it misses'],
    rows: [
      ['Course platforms', 'Sell a fixed syllabus', 'No idea what you already know'],
      ['Resume scanners', 'Match keywords to a job description', 'Trusts the resume completely'],
      [
        'A chatbot',
        'Writes a plausible roadmap',
        'No evidence, no score, no memory, invented links',
      ],
      ['Placement portals', 'List openings', 'Never say what you are missing for them'],
    ],
  },

  {
    kind: 'bullets',
    title: 'SkillProof',
    lead: 'Skills proven, not claimed. Four steps, all visible to the student.',
    bullets: [
      {
        text: 'Collect evidence',
        note: 'resume gives claimed skills, GitHub code gives observed skills traced to the file, a quiz gives verified skills',
      },
      {
        text: 'Price the gaps',
        note: 'readiness is the job description weighted share of the role you can prove',
      },
      {
        text: 'Plan against the evidence',
        note: 'ranked by cost, ordered by prerequisite, packed into your hours, ending in a proof project',
      },
      {
        text: 'Replan on proof',
        note: 'every new piece of evidence recalculates the score and rebuilds the weeks you have not touched',
      },
    ],
  },

  {
    kind: 'shot',
    title: 'One number, and the evidence behind it',
    lead: 'Readiness 47 out of 100 for ML Engineer. Every segment is a skill the role asks for.',
    image: '03-dashboard.png',
    bullets: [
      { text: 'Segment width is job description demand' },
      { text: 'Colour is the evidence level' },
      { text: 'Fill is how much of it is proven' },
    ],
  },

  {
    kind: 'shot',
    title: 'Every claim is traceable',
    lead: 'SQL appears in 64% of ML Engineer listings, sits on her resume, and appears in none of her nine repositories.',
    image: '04-evidence-sql.png',
    bullets: [
      { text: 'Claimed', note: 'on the resume only' },
      { text: 'Observed', note: 'found in code, with the repository and file named' },
      { text: 'Verified', note: 'passed an adaptive quiz' },
    ],
  },

  {
    kind: 'shot',
    title: 'Claiming is not proving',
    lead: 'SQL was on the resume. Under four adaptive questions it scores 25%, and the badge stays amber.',
    image: '09-quiz-sql-result.png',
    bullets: [
      { text: 'Harder after a correct answer, easier after a wrong one' },
      { text: 'Scored by difficulty weight, not raw count' },
      { text: 'The answer never reaches the browser before you answer' },
    ],
  },

  {
    kind: 'shot',
    title: 'A roadmap that answers why',
    lead: 'Eight weeks, eight hours a week, nothing over budget, prerequisites respected.',
    image: '11-roadmap-item.png',
    bullets: [
      { text: 'Why is written in numbers, not motivation' },
      { text: 'Resources come from a whitelist, so no invented links' },
      { text: 'Every item ends in a proof project with checkable criteria' },
    ],
  },

  {
    kind: 'shot',
    title: 'It replans when you prove something',
    lead: 'Marking a task done changes nothing. Linking the repository moves the score by 8.5 points.',
    image: '13-progress-replan.png',
    bullets: [
      { text: 'Docker, FastAPI and AWS become observed evidence' },
      { text: 'The plan rebuilds around what is left' },
      { text: 'Anything the student edited stays locked' },
    ],
  },

  {
    kind: 'bullets',
    title: 'How it is built',
    lead: 'Deterministic where it matters, AI where it helps.',
    bullets: [
      {
        text: 'Deterministic core',
        note: 'scoring, gap ranking and skill detection are plain TypeScript, so the same profile always gives the same score',
      },
      {
        text: 'AI at the edges',
        note: 'Sarvam AI writes the explanations and quiz questions, with Groq and Gemini as fallbacks',
      },
      {
        text: 'Everything validated',
        note: 'zod at every boundary, one repair retry, then the next provider, then built in logic',
      },
      {
        text: 'Runs with zero keys',
        note: 'the whole product works on deterministic logic when no provider is available',
      },
    ],
  },

  {
    kind: 'table',
    title: 'Stack and engineering',
    head: ['Layer', 'Choice'],
    rows: [
      [
        'Frontend',
        'Next.js 14 App Router, TypeScript strict, Tailwind with a custom token system, Recharts',
      ],
      [
        'Agent',
        'Resume and GitHub ingestion, 84 skill taxonomy, deterministic scoring and planner',
      ],
      [
        'Models',
        'Sarvam AI sarvam-105b-conversations, then Groq gpt-oss-120b, then Gemini 3.8 Flash',
      ],
      ['Data', 'Supabase Postgres in Mumbai, local JSON store when unconfigured'],
      ['Quality', '69 unit tests, typecheck, lint and build in GitHub Actions'],
    ],
  },

  {
    kind: 'closing',
    title: 'Impact and what is next',
    bullets: [
      {
        text: 'For a student',
        note: 'one number to argue with, a ranked list of what to fix, a portfolio project per gap',
      },
      {
        text: 'For a placement cell',
        note: 'the same engine across a cohort shows where training should actually go',
      },
      {
        text: 'Next',
        note: 'live job description ingestion, Hindi interface, mentor review as a fourth evidence level',
      },
    ],
  },
];
