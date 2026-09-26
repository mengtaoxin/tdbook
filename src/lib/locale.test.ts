import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, getStoredLocale, isAppLocale, setStoredLocale } from '@/lib/locale';

describe('locale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(getStoredLocale()).toBe('en');
  });

  it('validates locale codes', () => {
    expect(isAppLocale('en')).toBe(true);
    expect(isAppLocale('zh')).toBe(true);
    expect(isAppLocale('fr')).toBe(false);
  });

  it('stores and reads the locale preference', () => {
    setStoredLocale('zh');
    expect(getStoredLocale()).toBe('zh');
    setStoredLocale('en');
    expect(getStoredLocale()).toBe('en');
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('books.locale', 'fr');
    expect(getStoredLocale()).toBe('en');
  });
});
