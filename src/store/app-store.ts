import { create } from 'zustand'

interface AppState {
  isDarkMode: boolean
  toggleDarkMode: () => void
  notificationCount: number
  setNotificationCount: (count: number) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  isDarkMode: true,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode
      document.documentElement.classList.toggle('dark', next)
      return { isDarkMode: next }
    }),
  notificationCount: 0,
  setNotificationCount: (notificationCount) => set({ notificationCount }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))
