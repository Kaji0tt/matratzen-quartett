export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          bio: string | null
          level: number
          xp: number
          elo_rating: number
          coins: number
          boosters_opened: number
          cards_collected: number
          cards_contributed: number
          achievements_unlocked: number
          is_admin: boolean
          is_moderator: boolean
          is_banned: boolean
          ban_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          level?: number
          xp?: number
          elo_rating?: number
          coins?: number
          boosters_opened?: number
          cards_collected?: number
          cards_contributed?: number
          achievements_unlocked?: number
          is_admin?: boolean
          is_moderator?: boolean
          is_banned?: boolean
          ban_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      cards: {
        Row: {
          id: string
          name: string
          description: string
          rarity: string
          image_url: string
          location: string
          city: string
          country: string
          condition: string
          stat_alter: number
          stat_flecken: number
          stat_witterung: number
          stat_geruch: number
          stat_kontaminierung: number
          notes: string | null
          photographer_id: string
          is_approved: boolean
          report_count: number
          edition_number: number | null
          total_editions: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cards']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cards']['Insert']>
      }
      user_cards: {
        Row: {
          id: string
          user_id: string
          card_id: string
          acquired_at: string
          acquisition_type: string
          is_for_trade: boolean
          trade_price: number | null
          is_favorite: boolean
        }
        Insert: Omit<Database['public']['Tables']['user_cards']['Row'], 'id' | 'acquired_at'>
        Update: Partial<Database['public']['Tables']['user_cards']['Insert']>
      }
      booster_packs: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string
          price_coins: number
          card_count: number
          weight_common: number
          weight_uncommon: number
          weight_rare: number
          weight_epic: number
          weight_legendary: number
          is_available: boolean
          available_until: string | null
          limited_edition: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['booster_packs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['booster_packs']['Insert']>
      }
      trade_offers: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          offered_coins: number
          requested_coins: number
          status: string
          message: string | null
          created_at: string
          expires_at: string
        }
        Insert: Omit<Database['public']['Tables']['trade_offers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['trade_offers']['Insert']>
      }
      achievements: {
        Row: {
          id: string
          key: string
          name: string
          description: string
          icon: string
          category: string
          requirement: number
          xp_reward: number
          coin_reward: number
          rarity: string
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
          progress: number
        }
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'id' | 'unlocked_at'>
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      moderation_reports: {
        Row: {
          id: string
          reporter_id: string
          reported_card_id: string | null
          reported_user_id: string | null
          reason: string
          description: string
          status: string
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['moderation_reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['moderation_reports']['Insert']>
      }
      battles: {
        Row: {
          id: string
          player1_id: string
          player2_id: string
          player1_deck: string[]
          player2_deck: string[]
          winner_id: string | null
          status: string
          elo_change_winner: number
          elo_change_loser: number
          created_at: string
          finished_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['battles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['battles']['Insert']>
      }
    }
    Views: {
      leaderboard: {
        Row: {
          rank: number
          user_id: string
          username: string
          avatar_url: string | null
          elo_rating: number
          level: number
          cards_collected: number
          wins: number
          losses: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: {
      rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
      card_condition: 'mint' | 'excellent' | 'good' | 'fair' | 'poor'
      trade_status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
      battle_status: 'pending' | 'active' | 'finished'
      report_status: 'pending' | 'resolved' | 'dismissed'
    }
  }
}
