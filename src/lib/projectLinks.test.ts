import { describe, expect, it } from 'vitest';

import { GITHUB_ISSUES_URL, PROJECT_URL } from '@/lib/projectLinks';

describe('projectLinks', () => {
  it('points project URL at the tdbook GitHub repo', () => {
    expect(PROJECT_URL).toBe('https://github.com/mengtaoxin/tdbook');
  });

  it('points feedback at the repo issues page', () => {
    expect(GITHUB_ISSUES_URL).toBe('https://github.com/mengtaoxin/tdbook/issues');
  });
});
