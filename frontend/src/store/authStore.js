import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      token:        null,
      refreshToken: null,
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
      clearAuth: () => set({ user: null, token: null, refreshToken: null }),
      isAuthenticated: () => !!get().token,
      updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
    }),
    { name: 'auth-storage' }
  )
)
