import { describe, expect, it } from 'vitest';
import { detectSkillsFromRepo, mergeDetections, parseDependencies } from '@/lib/skills/detect';
import type { RepoSignals } from '@/lib/github/types';

function signals(partial: Partial<RepoSignals> = {}): RepoSignals {
  return {
    repo: 'demo-repo',
    description: '',
    languages: [],
    topics: [],
    files: [],
    dependencies: [],
    readme: '',
    pushed_at: '2026-01-01T00:00:00Z',
    ...partial,
  };
}

describe('parseDependencies', () => {
  it('reads runtime and dev dependencies from package.json', () => {
    const names = parseDependencies(
      'package.json',
      JSON.stringify({
        dependencies: { react: '^18.0.0', axios: '1.7.2' },
        devDependencies: { vitest: '^2.0.0' },
      }),
    );
    expect(names).toEqual(expect.arrayContaining(['react', 'axios', 'vitest']));
  });

  it('returns nothing for malformed package.json rather than throwing', () => {
    expect(parseDependencies('package.json', '{ not json')).toEqual([]);
  });

  it('strips versions, extras and comments from requirements.txt', () => {
    const names = parseDependencies(
      'requirements.txt',
      '# core\ntorch==2.1.0\npandas>=2.0\nuvicorn[standard]==0.30.1\n\n-r dev.txt\n',
    );
    expect(names).toEqual(['torch', 'pandas', 'uvicorn']);
  });

  it('reads both poetry and PEP 621 dependency styles from pyproject.toml', () => {
    const names = parseDependencies(
      'pyproject.toml',
      '[tool.poetry.dependencies]\npython = "^3.11"\ntorch = "^2.1"\n\n[project]\ndependencies = [\n  "fastapi>=0.110",\n]\n',
    );
    expect(names).toContain('torch');
    expect(names).toContain('fastapi');
    expect(names).not.toContain('python');
  });
});

describe('detectSkillsFromRepo', () => {
  it('records the manifest that proved a dependency based skill', () => {
    const detected = detectSkillsFromRepo(
      signals({
        files: ['requirements.txt'],
        dependencies: [{ name: 'torch', file: 'requirements.txt' }],
      }),
    );
    const pytorch = detected.find((entry) => entry.skill === 'PyTorch');
    expect(pytorch?.sources[0]).toMatchObject({
      repo: 'demo-repo',
      file: 'requirements.txt',
      hint: 'requirements.txt lists the dependency torch',
    });
  });

  it('treats a Dockerfile and a workflow directory as file evidence', () => {
    const detected = detectSkillsFromRepo(
      signals({ files: ['Dockerfile', '.github/workflows/ci.yml'] }),
    );
    const skills = detected.map((entry) => entry.skill);
    expect(skills).toContain('Docker');
    expect(skills).toContain('CI/CD');
    expect(detected.find((entry) => entry.skill === 'CI/CD')?.sources[0]?.file).toBe(
      '.github/workflows/ci.yml',
    );
  });

  it('accepts a README mention as evidence for a concept but not for a tool', () => {
    const detected = detectSkillsFromRepo(
      signals({ readme: 'This project covers feature engineering and uses Docker locally.' }),
    );
    const skills = detected.map((entry) => entry.skill);
    expect(skills).toContain('Feature engineering');
    expect(skills).not.toContain('Docker');
  });

  it('does not report a skill twice for one repository', () => {
    const detected = detectSkillsFromRepo(
      signals({
        languages: ['Python'],
        files: ['requirements.txt'],
        topics: ['python'],
      }),
    );
    expect(detected.filter((entry) => entry.skill === 'Python')).toHaveLength(1);
  });
});

describe('mergeDetections', () => {
  it('collects sources for the same skill across repositories', () => {
    const merged = mergeDetections([
      detectSkillsFromRepo(signals({ repo: 'a', files: ['Dockerfile'] })),
      detectSkillsFromRepo(signals({ repo: 'b', files: ['Dockerfile'] })),
    ]);
    expect(merged.get('Docker')?.map((source) => source.repo)).toEqual(['a', 'b']);
  });
});
