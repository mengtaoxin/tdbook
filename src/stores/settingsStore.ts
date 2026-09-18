import { create } from 'zustand'
import { invalidateBookConfigsCache } from '@/lib/catalog'
import {
  getStoredConfigsUrl,
  setConfigsUrl as persistConfigsUrl,
} from '@/lib/settings'
import { useBooksStore } from './booksStore'

type SettingsState = {
  configsUrl: string
  setConfigsUrl: (url: string) => void
  restoreDefault: () => void
  hydrate: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  configsUrl: getStoredConfigsUrl(),
  hydrate: () => {
    set({ configsUrl: getStoredConfigsUrl() })
  },
  setConfigsUrl: (url) => {
    persistConfigsUrl(url)
    set({ configsUrl: getStoredConfigsUrl() })
    invalidateBookConfigsCache()
    useBooksStore.getState().invalidate()
  },
  restoreDefault: () => {
    persistConfigsUrl('')
    set({ configsUrl: '' })
    invalidateBookConfigsCache()
    useBooksStore.getState().invalidate()
  },
}))
