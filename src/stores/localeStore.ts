import { create } from 'zustand';
import i18n, { setAppLocale } from '@/i18n';
import { getStoredLocale, setStoredLocale, type AppLocale } from '@/lib/locale';

type LocaleState = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: getStoredLocale(),
  setLocale: (locale) => {
    try {
      setStoredLocale(locale);
    } catch {
      // localStorage may be unavailable; still update UI locale
    }
    setAppLocale(locale);
    set({ locale });
  },
}));

/** Keep store in sync if i18n language changes outside the store. */
i18n.on('languageChanged', (lng) => {
  if (lng === 'en' || lng === 'zh') {
    useLocaleStore.setState({ locale: lng });
  }
});
