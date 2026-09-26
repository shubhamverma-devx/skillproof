import { getStore } from '@/lib/db';
import { getRoleStats } from '@/lib/dataset';
import { getDemoScan, summariseScan } from '@/lib/demo';
import { isRoleSlug } from '@/types/data';
import type { EvidenceUpsert } from '@/lib/db/types';
import type { SkillAssessment } from '@/lib/scoring';
import { computeGaps } from './computeGaps';
import { ingestGithub } from './ingestGithub';
import { ingestResume } from './ingestResume';
import { Tracer, type TraceListener } from './trace';
import { verifiedScoresFor } from './quiz-history';

export type AnalysisResult = {
  score: number;
  assessments: SkillAssessment[];
  github_warning: string | null;
};

/**
 * The full first pass: resume in, code evidence in, gaps and readiness out.
 * Called by POST /api/analyze/[id] while streaming each step to the browser.
 */
export async function runAnalysis(
  profileId: string,
  listener?: TraceListener,
): Promise<AnalysisResult> {
  const store = getStore();
  const tracer = new Tracer(profileId, listener);

  const profile = await store.getProfile(profileId);
  if (!profile) throw new Error('Profile not found');
  if (!isRoleSlug(profile.target_role)) throw new Error('Unknown target role');

  const role = getRoleStats(profile.target_role);
  await tracer.info(
    'Analysis started',
    `Target role ${role.role}, ${role.skills.length} skills weighted by ${role.jd_count} job descriptions`,
  );

  const resume = await ingestResume(profile.resume_text, tracer, profile.is_demo);
  await describeResume(resume, tracer);
  const github = await ingestGithub(
    profile.github_username,
    tracer,
    profile.is_demo ? getDemoScan() : undefined,
  );

  const verified = await verifiedScoresFor(profileId);
  if (verified.size > 0) {
    await tracer.info('Quiz results applied', `${verified.size} skills carry a quiz score`);
  }

  const analysis = computeGaps({
    role,
    claimed: resume.claimed,
    observed: github.observed,
    verified,
    scanned_repos: github.scan?.activity.scanned_repos ?? 0,
    github_available: github.scan !== null,
  });

  await store.replaceSkillEvidence(profileId, toEvidenceRows(analysis.assessments));
  if (github.scan) {
    await store.updateProfile(profileId, { github_summary: summariseScan(github.scan) });
  }

  await tracer.info(
    'Readiness score computed',
    `${analysis.score.score} out of 100, from ${analysis.score.covered_weight} of ${analysis.score.total_weight} weighted skill demand`,
  );
  const top = analysis.gaps
    .slice(0, 3)
    .map((gap) => gap.skill)
    .join(', ');
  if (top) await tracer.info('Top gaps ranked', `Biggest readiness cost right now: ${top}`);

  await store.addScore(profileId, analysis.score.score, 'Initial analysis of resume and GitHub');

  return {
    score: analysis.score.score,
    assessments: analysis.assessments,
    github_warning: github.warning,
  };
}

/**
 * The resume extraction carries more than skills. None of it changes the score,
 * so it is surfaced on the trace rather than stored: the student can see what the
 * agent actually read out of their resume.
 */
async function describeResume(
  resume: Awaited<ReturnType<typeof ingestResume>>,
  tracer: Tracer,
): Promise<void> {
  const { projects, education } = resume.extraction;
  const parts: string[] = [
    `skills read by ${resume.source === 'model' ? 'the model' : 'keyword matching'}`,
  ];
  if (projects.length > 0) parts.push(`${projects.length} projects`);
  if (education.trim().length > 0) parts.push(`education: ${education.slice(0, 80)}`);
  await tracer.info('Resume contents', parts.join(', '));
}

export function toEvidenceRows(assessments: SkillAssessment[]): EvidenceUpsert[] {
  return assessments.map((assessment) => ({
    skill: assessment.skill,
    claimed: assessment.claimed,
    observed: assessment.observed,
    observed_sources: assessment.observed_sources,
    verified_score: assessment.verified_score,
    proficiency: assessment.proficiency,
  }));
}
