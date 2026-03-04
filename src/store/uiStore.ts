import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  activeModal: string | null

  toggleTheme:     () => void
  setTheme:        (t: 'light' | 'dark') => void
  setSidebarOpen:  (v: boolean) => void
  toggleSidebar:   () => void
  collapseSidebar: (v: boolean) => void
  openModal:       (id: string) => void
  closeModal:      () => void
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      theme:            'light',
      sidebarOpen:      true,
      sidebarCollapsed: false,
      activeModal:      null,

      toggleTheme:     () => set(s => {
        const next = s.theme === 'light' ? 'dark' : 'light'
        document.documentElement.classList.toggle('dark', next === 'dark')
        return { theme: next }
      }),
      setTheme: t => {
        document.documentElement.classList.toggle('dark', t === 'dark')
        set({ theme: t })
      },
      setSidebarOpen:  v  => set({ sidebarOpen: v }),
      toggleSidebar:   () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      collapseSidebar: v  => set({ sidebarCollapsed: v }),
      openModal:       id => set({ activeModal: id }),
      closeModal:      () => set({ activeModal: null }),
    }),
    {
      name: 'flacron-ui',
      partialize: state => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
      onRehydrateStorage: () => state => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)
