# Demo video script

Target length 2 minutes 45 seconds. Record at 1440px wide in the light theme.

Before you start:

```bash
rm -rf .data        # start from an empty store
pnpm dev
```

Have the home page open at `http://localhost:3000`. Do not pre-load a profile:
the demo profile is created live so the analysis screen has something to show.

---

## 0:00 to 0:20, the problem

**On screen:** home page.

> Every final year student has the same two questions. Which skills am I actually
> missing for the job I want, and what do I build to prove it. The usual answer
> is a generic roadmap built on a resume nobody checked.
>
> SkillProof checks. It separates what you claim from what you can prove, and it
> prices every gap against real job descriptions.

Click **Load demo profile**.

---

## 0:20 to 0:45, the agent works in the open

**On screen:** the live analysis screen, steps appearing one by one.

> This is the agent running. It parses the resume, scans the public GitHub
> repositories, and records which file proved which skill. Every step is logged,
> including the ones that fail. Here it says no model was available for the resume
> extraction, so it fell back to deterministic keyword matching. Nothing is hidden.

Let it redirect to the dashboard on its own.

---

## 0:45 to 1:20, the score and the evidence

**On screen:** dashboard, the Proof Meter filling.

> Readiness is 47 out of 100 for ML Engineer. That bar is the whole score in one
> shape: one segment per skill the role asks for, the width is how often job
> descriptions ask for it, the colour is what kind of evidence she has, and the
> fill is how much of it is proven.

Hover one teal segment, then one grey segment.

> Teal means we found it in her code. Grey means nothing at all.

Scroll to the skills table, expand **SQL**.

> Every claim is traceable. SQL appears in 64 percent of ML Engineer listings, it
> is on her resume, and it appears in none of her nine repositories. That is a
> claim without proof.

---

## 1:20 to 1:45, proving a skill

**On screen:** click **Verify Python** in the skills table.

> Four adaptive questions. Get one right and the next is harder, get one wrong and
> the next is easier, and the score is weighted by difficulty.

Answer the first question, show the explanation, then skip ahead in the edit to
the result screen.

> Python comes back verified at 100 percent, and the readiness score moves to
> 49.5. Now do the same for SQL.

Show the SQL result at 25 percent.

> SQL was claimed on the resume. Under four questions it scores 25 percent. The
> badge stays amber, not blue. Claiming a skill is not proving it, and the score
> now reflects that.

---

## 1:45 to 2:15, the roadmap

**On screen:** click **Build my roadmap**, then open week 1.

> Eight weeks, eight hours a week, nothing over budget. SQL comes first because it
> costs the most readiness. Prerequisites are respected: Python before PyTorch,
> Docker before deployment.
>
> Every item says why it is here, in numbers, not motivation. And every item ends
> in a proof project with acceptance criteria you can check by opening a repository.
> This one covers two gaps at once.

Point at the draft banner and click **Approve roadmap**.

> Nothing is fixed until the student approves it. They can reorder, change the
> hours, skip anything, or edit an item, and once they do the agent will not
> rewrite it.

---

## 2:15 to 2:45, the replan

**On screen:** go to **Log progress**.

> Two weeks later. She finished the first item, so she marks it done.

Mark the first item done. **Pause for two seconds on the unchanged score.**

> Notice the score has not moved. Marking a task done is not proof. Linking a
> repo or passing a quiz is.

Paste `riya-sharma-demo/ml-deploy-service` and click **Scan repository**.

> Now she links the repository she actually built. The agent scans it, finds a
> Dockerfile, a FastAPI service, a GitHub Actions workflow and boto3, and the score
> jumps from 49 to 56. The "what changed" box shows exactly which weeks moved and
> what was added.

Go back to the dashboard.

> Then she retakes the Docker and SQL quizzes, and readiness reaches 62. The score
> history chart tells the whole story: flat while she was only claiming progress,
> rising every time she proved something.

**Close on the score history chart.**

> SkillProof. Skills proven, not claimed.

---

## Recovery notes

| If this happens             | Do this                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| The analysis screen hangs   | Refresh once. If it still hangs, open `/dashboard/<id>` directly, the analysis writes as it goes                                 |
| A quiz question looks wrong | Say "the offline question bank is running because there is no API key", it is the honest answer and it is on screen in the trace |
| The repository scan fails   | It cannot on the demo profile: the scan is replayed from `data/demo/progress_repo.json`                                          |
| You lose the profile URL    | `pnpm demo:verify` prints a fresh dashboard link with the whole storyline already applied                                        |
