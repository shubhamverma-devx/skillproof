import type { LearningResource, ProofProject } from '@/types/domain';

/** A roadmap item before it is given a roadmap id and written to the store. */
export type PlannedItem = {
  week: number;
  skill: string;
  title: string;
  why: string;
  evidence_summary: string;
  jd_frequency: number;
  est_hours: number;
  resources: LearningResource[];
  proof_project: ProofProject | null;
  order_index: number;
};

export type PlanContext = {
  role: string;
  weekly_hours: number;
  /** Sum of JD frequencies for the role, used to price a gap in score points. */
  total_weight: number;
  /** Hours left in the planning horizon after items the student already owns. */
  available_hours: number;
  /** Hours already committed per week by locked items, so weeks are not overfilled. */
  reserved_weeks: Map<number, number>;
};
