import { beforeEach, describe, expect, it } from 'vitest';
import {
  getConfigsUrl,
  getStoredConfigsUrl,
  isValidConfigsUrl,
  setConfigsUrl,
} from '@/lib/settings';

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates configs URL shapes', () => {
    expect(isValidConfigsUrl('')).toBe(true);
    expect(isValidConfigsUrl('/my/configs.json')).toBe(true);
    expect(isValidConfigsUrl('https://example.com/c.json')).toBe(true);
    expect(isValidConfigsUrl('ftp://x')).toBe(false);
  });

  it('defaults to the bundled sample catalog', () => {
    expect(getConfigsUrl()).toBe('/sample/configs.json');
  });

  it('stores and clears the configs URL override', () => {
    setConfigsUrl('https://example.com/configs.json');
    expect(getStoredConfigsUrl()).toBe('https://example.com/configs.json');
    expect(getConfigsUrl()).toBe('https://example.com/configs.json');
    setConfigsUrl('');
    expect(getConfigsUrl()).toBe('/sample/configs.json');
  });
});
