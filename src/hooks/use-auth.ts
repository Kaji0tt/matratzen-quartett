import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

function calculateXpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

function mapProfileRow(data: ProfileRow) {
  return {
    id: data.id,
    username: data.username,
    avatar_url: data.avatar_url ?? undefined,
    bio: data.bio ?? undefined,
    level: data.level,
    xp: data.xp,
    xp_to_next_level: calculateXpToNextLevel(data.level),
    elo_rating: data.elo_rating,
    coins: data.coins,
    boosters_opened: data.boosters_opened,
    cards_collected: data.cards_collected,
    cards_contributed: data.cards_contributed,
    achievements_unlocked: data.achievements_unlocked,
    created_at: data.created_at,
    is_admin: data.is_admin,
    is_moderator: data.is_moderator,
    is_banned: data.is_banned,
    ban_reason: data.ban_reason ?? undefined,
  }
}

export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setLoading, reset } =
    useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (data) {
            setProfile(mapProfileRow(data))
          }
        } else {
          reset()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setLoading, reset])

  return { user, profile, isLoading }
}

export async function signOut() {
  await supabase.auth.signOut()
}
