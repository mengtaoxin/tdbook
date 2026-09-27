import { create } from 'zustand';
import { getStoredConfigsUrl, setConfigsUrl as persistConfigsUrl } from '@/lib/settings';
import { invalidateCatalog } from './booksStore';

type SettingsState = {
  configsUrl: string;
  setConfigsUrl: (url: string) => void;
  restoreDefault: () => void;
  hydrate: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  configsUrl: getStoredConfigsUrl(),
  hydrate: () => {
    set({ configsUrl: getStoredConfigsUrl() });
  },
  setConfigsUrl: (url) => {
    persistConfigsUrl(url);
    set({ configsUrl: getStoredConfigsUrl() });
    invalidateCatalog();
  },
  restoreDefault: () => {
    persistConfigsUrl('');
    set({ configsUrl: '' });
    invalidateCatalog();
  },
}));
