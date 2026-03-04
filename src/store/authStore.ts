import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/auth.types'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: AuthUser | null | ((prev: AuthUser | null) => AuthUser | null)) => void
  setLoading: (v: boolean) => void
  setInitialized: (v: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user:          null,
      isLoading:     true,
      isInitialized: false,

      setUser: userOrUpdater => set(state => ({
        user: typeof userOrUpdater === 'function'
          ? userOrUpdater(state.user)
          : userOrUpdater,
      })),
      setLoading:     v     => set({ isLoading: v }),
      setInitialized: v     => set({ isInitialized: v }),
      signOut:        ()    => set({ user: null }),
    }),
    {
      name: 'flacron-auth',
      partialize: state => ({ user: state.user }),
    }
  )
)
