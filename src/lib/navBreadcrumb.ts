const TOP_LEVEL: Record<string, string> = {
  '/books': 'nav.books',
};

const UNDER_MORE: Record<string, string> = {
  '/logs': 'nav.logs',
  '/settings': 'nav.settings',
  '/config-guide': 'nav.configGuide',
  '/about': 'nav.about',
};

/** i18n label keys for the display-only menu trail of a pathname. */
export function routeBreadcrumbKeys(pathname: string): string[] {
  const top = TOP_LEVEL[pathname];
  if (top) return [top];

  const nested = UNDER_MORE[pathname];
  if (nested) return ['nav.more', nested];

  return [];
}
