'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SkillAssessment } from '@/lib/scoring';

const CATEGORY_LABEL: Record<string, string> = {
  language: 'Languages',
  framework: 'Frameworks',
  library: 'Libraries',
  tool: 'Tools',
  platform: 'Platforms',
  database: 'Databases',
  concept: 'Concepts',
};

/**
 * Demand against proof, by skill category. Both series are JD weighted averages,
 * so a category is only "required" as far as real listings ask for it.
 */
export function CategoryRadar({ assessments }: { assessments: SkillAssessment[] }) {
  const buckets = new Map<string, { demand: number; proven: number }>();

  for (const assessment of assessments) {
    if (assessment.frequency === 0) continue;
    const bucket = buckets.get(assessment.category) ?? { demand: 0, proven: 0 };
    bucket.demand += assessment.frequency;
    bucket.proven += assessment.frequency * assessment.proficiency;
    buckets.set(assessment.category, bucket);
  }

  const data = [...buckets.entries()]
    .map(([category, bucket]) => ({
      category: CATEGORY_LABEL[category] ?? category,
      required: 100,
      you: Math.round((100 * bucket.proven) / bucket.demand),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  if (data.length < 3) {
    return <p className="px-5 py-4 text-ui-sm text-muted">Not enough categories to compare yet.</p>;
  }

  return (
    <div className="px-2 py-3">
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgb(var(--ink) / 0.12)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Role requirement"
            dataKey="required"
            stroke="rgb(var(--ink) / 0.35)"
            fill="rgb(var(--ink))"
            fillOpacity={0.05}
            isAnimationActive={false}
          />
          <Radar
            name="Your proven level"
            dataKey="you"
            stroke="rgb(var(--primary))"
            fill="rgb(var(--primary))"
            fillOpacity={0.22}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgb(var(--surface))',
              border: '1px solid rgb(var(--ink) / 0.12)',
              borderRadius: 8,
              fontSize: 13,
              color: 'rgb(var(--ink))',
            }}
            formatter={(value, name) => [`${String(value)} of 100`, name]}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="px-3 pb-1 text-ui-sm text-muted">
        Outer ring is what the role asks for. The filled shape is what you can prove.
      </p>
    </div>
  );
}
