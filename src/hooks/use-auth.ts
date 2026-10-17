import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database-gen'

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
    let active = true
    const updateUser = (nextUser: User | null) => {
      if (!active) return
      if (!nextUser) {
        reset()
        return
      }
      if (useAuthStore.getState().user?.id !== nextUser.id) {
        setProfile(null)
        setLoading(true)
      }
      setUser(nextUser)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => updateUser(session?.user ?? null)
    )

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active) return
      if (error) {
        toast({ title: 'Anmeldung fehlgeschlagen', description: error.message, variant: 'destructive' })
      }
      updateUser(session?.user ?? null)
    }).catch((error: unknown) => {
      if (!active) return
      reset()
      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Die Sitzung konnte nicht geladen werden.',
        variant: 'destructive',
      })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading, reset])

  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let active = true
    setLoading(true)

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
        if (error) throw error
        if (active) setProfile(mapProfileRow(data))
      } catch (error) {
        if (!active) return
        setProfile(null)
        toast({
          title: 'Profil konnte nicht geladen werden',
          description: error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
              ? error.message
              : 'Bitte lade die Seite erneut.',
          variant: 'destructive',
        })
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadProfile()
    return () => { active = false }
  }, [userId, setProfile, setLoading])

  return { user, profile, isLoading }
}

export async function signOut() {
  await supabase.auth.signOut()
}
