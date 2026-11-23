import { describe, expect, it } from 'vitest';

import { routeBreadcrumbKeys } from '@/lib/navBreadcrumb';

describe('routeBreadcrumbKeys', () => {
  it('returns no trail on home', () => {
    expect(routeBreadcrumbKeys('/')).toEqual([]);
  });

  it('returns the top-level menu label for Books', () => {
    expect(routeBreadcrumbKeys('/books')).toEqual(['nav.books']);
  });

  it('returns More then the item for nested menu routes', () => {
    expect(routeBreadcrumbKeys('/logs')).toEqual(['nav.more', 'nav.logs']);
    expect(routeBreadcrumbKeys('/settings')).toEqual(['nav.more', 'nav.settings']);
    expect(routeBreadcrumbKeys('/config-guide')).toEqual(['nav.more', 'nav.configGuide']);
    expect(routeBreadcrumbKeys('/about')).toEqual(['nav.more', 'nav.about']);
  });

  it('returns no trail on the reader (not a menu page)', () => {
    expect(routeBreadcrumbKeys('/book/sample-epub')).toEqual([]);
  });
});
