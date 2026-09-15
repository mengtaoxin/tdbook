import { createI18n } from 'vue-i18n'
import { getStoredLocale, type AppLocale } from '@/lib/locale'
import en from './locales/en'
import zh from './locales/zh'

export const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'en',
  messages: { en, zh },
})

export function setAppLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
}

/** Translate message keys used as Error.message from lib code. */
export function translateError(
  err: unknown,
  fallbackKey: string,
): string {
  if (!(err instanceof Error)) {
    return String(i18n.global.t(fallbackKey))
  }
  const message = err.message
  const downloadMatch = /^errors\.downloadFailed:(\d+)$/.exec(message)
  if (downloadMatch) {
    return String(
      i18n.global.t('errors.downloadFailed', { status: downloadMatch[1] }),
    )
  }
  if (message.startsWith('errors.')) {
    return String(i18n.global.t(message))
  }
  return message
}

setAppLocale(getStoredLocale())
