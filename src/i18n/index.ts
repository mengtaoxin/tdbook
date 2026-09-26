import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getStoredLocale, type AppLocale } from '@/lib/locale';
import en from './locales/en';
import zh from './locales/zh';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: getStoredLocale(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
    // Match vue-i18n / catalog style: {name} not {{name}}
    prefix: '{',
    suffix: '}',
  },
});

export function setAppLocale(locale: AppLocale) {
  void i18n.changeLanguage(locale);
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
}

/** Translate message keys used as Error.message from lib code. */
export function translateError(err: unknown, fallbackKey: string): string {
  if (!(err instanceof Error)) {
    return i18n.t(fallbackKey);
  }
  const message = err.message;
  const downloadMatch = /^errors\.downloadFailed:(\d+)$/.exec(message);
  if (downloadMatch) {
    return i18n.t('errors.downloadFailed', { status: downloadMatch[1] });
  }
  if (message.startsWith('errors.')) {
    return i18n.t(message);
  }
  return message;
}

setAppLocale(getStoredLocale());

export default i18n;
