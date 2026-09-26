export const DEFAULT_CONFIGS_URL = '/configs.json';

const CONFIGS_URL_KEY = 'books.configsUrl';

export function isValidConfigsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/')) return true;
  return /^https?:\/\//i.test(trimmed);
}

/** Effective catalog URL: stored override, or default `/configs.json`. */
export function getConfigsUrl(): string {
  try {
    const stored = localStorage.getItem(CONFIGS_URL_KEY)?.trim() ?? '';
    return stored || DEFAULT_CONFIGS_URL;
  } catch {
    return DEFAULT_CONFIGS_URL;
  }
}

/** Raw stored value for the settings form (empty means “use default”). */
export function getStoredConfigsUrl(): string {
  try {
    return localStorage.getItem(CONFIGS_URL_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

/**
 * Persist catalog URL override. Empty string clears the override.
 * @throws if the value is not empty, a same-origin path, or http(s)
 */
export function setConfigsUrl(url: string): void {
  const trimmed = url.trim();
  if (!isValidConfigsUrl(trimmed)) {
    throw new Error('errors.invalidConfigsUrl');
  }
  try {
    if (!trimmed) {
      localStorage.removeItem(CONFIGS_URL_KEY);
    } else {
      localStorage.setItem(CONFIGS_URL_KEY, trimmed);
    }
  } catch {
    throw new Error('errors.localStorageWrite');
  }
}
