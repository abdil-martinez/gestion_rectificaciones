import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'dark', // 'dark' | 'light' | 'system'
      setMode: (mode) => set({ mode }),
    }),
    { name: 'gnarc-theme-mode' }
  )
)
