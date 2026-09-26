/**
 * Ordering constraints used when sequencing a roadmap. Only prerequisites that
 * are themselves in the plan matter: a student who already proves Python does
 * not get a Python week before PyTorch.
 */
const PREREQUISITES: Record<string, string[]> = {
  Pandas: ['Python'],
  NumPy: ['Python'],
  'scikit-learn': ['Python'],
  'Machine learning': ['Python', 'Statistics'],
  'Deep learning': ['Machine learning'],
  PyTorch: ['Python', 'Deep learning'],
  TensorFlow: ['Python', 'Deep learning'],
  NLP: ['Machine learning'],
  'Computer vision': ['Machine learning'],
  'Feature engineering': ['Pandas'],
  'Data cleaning': ['Pandas'],
  MLflow: ['Machine learning'],
  'Model deployment': ['REST APIs', 'Docker'],
  FastAPI: ['Python', 'REST APIs'],
  Flask: ['Python'],
  Django: ['Python'],
  React: ['JavaScript'],
  'Next.js': ['React'],
  Redux: ['React'],
  TypeScript: ['JavaScript'],
  'Node.js': ['JavaScript'],
  Express: ['Node.js'],
  'Tailwind CSS': ['CSS'],
  'Responsive design': ['CSS'],
  Accessibility: ['HTML'],
  'Web performance': ['JavaScript'],
  Vite: ['JavaScript'],
  Jest: ['Testing'],
  Playwright: ['Testing'],
  GraphQL: ['REST APIs'],
  Authentication: ['REST APIs'],
  Caching: ['REST APIs'],
  'Message queues': ['REST APIs'],
  Microservices: ['REST APIs', 'Docker'],
  'System design': ['REST APIs'],
  PostgreSQL: ['SQL'],
  MySQL: ['SQL'],
  'Data modelling': ['SQL'],
  ETL: ['SQL'],
  'Business intelligence': ['SQL'],
  'Power BI': ['Data visualisation'],
  Tableau: ['Data visualisation'],
  'A/B testing': ['Statistics'],
  'Spring Boot': ['Java'],
  Docker: ['Linux'],
  Kubernetes: ['Docker'],
  'CI/CD': ['Git'],
  'GitHub Actions': ['Git', 'CI/CD'],
  Jenkins: ['CI/CD'],
  Nginx: ['Linux'],
  Ansible: ['Linux', 'Shell scripting'],
  Monitoring: ['Linux'],
  Prometheus: ['Monitoring'],
  Grafana: ['Monitoring'],
  AWS: ['Cloud fundamentals'],
  Azure: ['Cloud fundamentals'],
  GCP: ['Cloud fundamentals'],
  Terraform: ['Cloud fundamentals'],
  'Infrastructure as code': ['Terraform'],
};

export function prerequisitesOf(skill: string): string[] {
  return PREREQUISITES[skill] ?? [];
}

/**
 * Depth of a skill in the prerequisite graph, counting only skills present in
 * `planned`. Cycles in the table would otherwise hang this, so visited skills
 * are tracked and treated as depth zero.
 */
export function prerequisiteDepth(
  skill: string,
  planned: Set<string>,
  visited = new Set<string>(),
): number {
  if (visited.has(skill)) return 0;
  visited.add(skill);

  const parents = prerequisitesOf(skill).filter((parent) => planned.has(parent));
  if (parents.length === 0) return 0;

  return 1 + Math.max(...parents.map((parent) => prerequisiteDepth(parent, planned, visited)));
}
