export type AppLocale = 'en' | 'zh';

export const DEFAULT_LOCALE: AppLocale = 'en';
export const SUPPORTED_LOCALES: readonly AppLocale[] = ['en', 'zh'];

const LOCALE_KEY = 'books.locale';

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Effective locale: stored preference, or English default. */
export function getStoredLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY)?.trim() ?? '';
    if (isAppLocale(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

/**
 * Persist display locale.
 * @throws if localStorage is unavailable
 */
export function setStoredLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    throw new Error('errors.localStorageWrite');
  }
}
