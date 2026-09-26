import { describe, expect, it } from 'vitest';
import { findSkillsInText, normaliseSkillName, skillSlug } from '@/lib/skills/taxonomy';

describe('normaliseSkillName', () => {
  it('maps common spellings onto one canonical name', () => {
    expect(normaliseSkillName('JS')).toBe('JavaScript');
    expect(normaliseSkillName('javascript')).toBe('JavaScript');
    expect(normaliseSkillName('ES6')).toBe('JavaScript');
    expect(normaliseSkillName('sklearn')).toBe('scikit-learn');
    expect(normaliseSkillName('scikit learn')).toBe('scikit-learn');
    expect(normaliseSkillName('React.js')).toBe('React');
    expect(normaliseSkillName('  node js  ')).toBe('Node.js');
  });

  it('returns null for skills outside the taxonomy instead of inventing one', () => {
    expect(normaliseSkillName('Blockchain')).toBeNull();
    expect(normaliseSkillName('')).toBeNull();
  });
});

describe('skillSlug', () => {
  it('produces the identifiers used by the question bank files', () => {
    expect(skillSlug('REST APIs')).toBe('rest-apis');
    expect(skillSlug('Machine learning')).toBe('machine-learning');
    expect(skillSlug('CI/CD')).toBe('ci-cd');
    expect(skillSlug('scikit-learn')).toBe('scikit-learn');
  });
});

describe('findSkillsInText', () => {
  it('matches whole words across line breaks and bullet lists', () => {
    const found = findSkillsInText('Requirements\n- Linux\n- Docker\n- Git\n');
    expect(found).toContain('Linux');
    expect(found).toContain('Docker');
    expect(found).toContain('Git');
  });

  it('does not let a longer skill leak into a shorter alias inside it', () => {
    expect(findSkillsInText('We use Node.js on the server')).toEqual(['Node.js']);
    expect(findSkillsInText('Pipelines run on GitHub Actions')).toEqual(['GitHub Actions']);
  });

  it('still finds the shorter skill when it stands on its own', () => {
    const found = findSkillsInText('Strong JS fundamentals and Git workflow');
    expect(found).toContain('JavaScript');
    expect(found).toContain('Git');
  });

  it('ignores skill names buried inside longer words', () => {
    expect(findSkillsInText('The postgresqlish approach')).not.toContain('SQL');
  });
});
