import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { AuthPage } from '@/pages/AuthPage'
import { BoosterPage } from '@/pages/BoosterPage'
import { CollectionPage } from '@/pages/CollectionPage'
import { TradingPage } from '@/pages/TradingPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { AdminPage } from '@/pages/AdminPage'
import { SubmitCardPage } from '@/pages/SubmitCardPage'
import { useAuth } from '@/hooks/use-auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function AppRoutes() {
  useAuth() // Initialize auth listener
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/boosters" element={<BoosterPage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/trading" element={<TradingPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/submit" element={<SubmitCardPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
