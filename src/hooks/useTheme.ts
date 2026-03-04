import { useUIStore } from '@/store/uiStore'

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useUIStore()
  return { theme, isDark: theme === 'dark', toggleTheme, setTheme }
}
