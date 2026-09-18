import { create } from 'zustand'
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
    useBooksStore.getState().invalidate()
  },
  restoreDefault: () => {
    persistConfigsUrl('')
    set({ configsUrl: '' })
    useBooksStore.getState().invalidate()
  },
}))
