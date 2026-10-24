export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: Database["public"]["Enums"]["achievement_category"]
          coin_reward: number
          description: string
          icon: string
          id: string
          key: string
          name: string
          rarity: Database["public"]["Enums"]["rarity"]
          requirement: number
          xp_reward: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["achievement_category"]
          coin_reward?: number
          description: string
          icon?: string
          id?: string
          key: string
          name: string
          rarity?: Database["public"]["Enums"]["rarity"]
          requirement?: number
          xp_reward?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["achievement_category"]
          coin_reward?: number
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          rarity?: Database["public"]["Enums"]["rarity"]
          requirement?: number
          xp_reward?: number
        }
        Relationships: []
      }
      battle_rounds: {
        Row: {
          battle_id: string
          chosen_stat: string
          created_at: string
          id: string
          player1_card_id: string
          player2_card_id: string
          round_number: number
          winner_id: string
        }
        Insert: {
          battle_id: string
          chosen_stat: string
          created_at?: string
          id?: string
          player1_card_id: string
          player2_card_id: string
          round_number: number
          winner_id: string
        }
        Update: {
          battle_id?: string
          chosen_stat?: string
          created_at?: string
          id?: string
          player1_card_id?: string
          player2_card_id?: string
          round_number?: number
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_rounds_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_rounds_player1_card_id_fkey"
            columns: ["player1_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_rounds_player2_card_id_fkey"
            columns: ["player2_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_rounds_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "battle_rounds_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          created_at: string
          elo_change_loser: number
          elo_change_winner: number
          finished_at: string | null
          id: string
          player1_deck: string[]
          player1_id: string
          player2_deck: string[]
          player2_id: string
          status: Database["public"]["Enums"]["battle_status"]
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          elo_change_loser?: number
          elo_change_winner?: number
          finished_at?: string | null
          id?: string
          player1_deck?: string[]
          player1_id: string
          player2_deck?: string[]
          player2_id: string
          status?: Database["public"]["Enums"]["battle_status"]
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          elo_change_loser?: number
          elo_change_winner?: number
          finished_at?: string | null
          id?: string
          player1_deck?: string[]
          player1_id?: string
          player2_deck?: string[]
          player2_id?: string
          status?: Database["public"]["Enums"]["battle_status"]
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "battles_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "battles_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "battles_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booster_opening_requests: {
        Row: {
          booster_opening_id: string
          created_at: string
          request_id: string
          user_id: string
        }
        Insert: {
          booster_opening_id: string
          created_at?: string
          request_id: string
          user_id: string
        }
        Update: {
          booster_opening_id?: string
          created_at?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booster_opening_requests_booster_opening_id_fkey"
            columns: ["booster_opening_id"]
            isOneToOne: true
            referencedRelation: "booster_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booster_opening_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booster_opening_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booster_openings: {
        Row: {
          booster_pack_id: string
          cards_received: string[]
          coins_spent: number
          id: string
          opened_at: string
          user_id: string
        }
        Insert: {
          booster_pack_id: string
          cards_received: string[]
          coins_spent: number
          id?: string
          opened_at?: string
          user_id: string
        }
        Update: {
          booster_pack_id?: string
          cards_received?: string[]
          coins_spent?: number
          id?: string
          opened_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booster_openings_booster_pack_id_fkey"
            columns: ["booster_pack_id"]
            isOneToOne: false
            referencedRelation: "booster_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booster_openings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booster_openings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booster_packs: {
        Row: {
          available_until: string | null
          card_count: number
          created_at: string
          description: string
          id: string
          image_url: string
          is_available: boolean
          limited_edition: boolean
          name: string
          price_coins: number
          weight_common: number
          weight_epic: number
          weight_legendary: number
          weight_rare: number
        }
        Insert: {
          available_until?: string | null
          card_count?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_available?: boolean
          limited_edition?: boolean
          name: string
          price_coins?: number
          weight_common?: number
          weight_epic?: number
          weight_legendary?: number
          weight_rare?: number
        }
        Update: {
          available_until?: string | null
          card_count?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_available?: boolean
          limited_edition?: boolean
          name?: string
          price_coins?: number
          weight_common?: number
          weight_epic?: number
          weight_legendary?: number
          weight_rare?: number
        }
        Relationships: []
      }
      card_generation_settings: {
        Row: {
          id: boolean
          style_guide: string
          updated_at: string
        }
        Insert: {
          id?: boolean
          style_guide: string
          updated_at?: string
        }
        Update: {
          id?: boolean
          style_guide?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_submissions: {
        Row: {
          submitted_name: string | null
          submitted_description: string | null
          legacy_stats: Json | null
          stats_need_review: boolean
          ai_attempts: number
          ai_error: string | null
          ai_result: Json | null
          ai_started_at: string | null
          captured_at: string
          card_id: string | null
          city: string
          country: string
          created_at: string
          description: string | null
          discovery_story: string
          final_stats: Json | null
          found_on: string
          id: string
          image_path: string
          location: string
          moderation_notes: string
          name: string | null
          observations: string
          proposed_stats: Json
          rarity: Database["public"]["Enums"]["rarity"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          surroundings: string
          updated_at: string
          user_id: string
        }
        Insert: {
          submitted_name?: string | null
          submitted_description?: string | null
          legacy_stats?: Json | null
          stats_need_review?: boolean
          ai_attempts?: number
          ai_error?: string | null
          ai_result?: Json | null
          ai_started_at?: string | null
          captured_at: string
          card_id?: string | null
          city: string
          country?: string
          created_at?: string
          description?: string | null
          discovery_story?: string
          final_stats?: Json | null
          found_on: string
          id?: string
          image_path: string
          location: string
          moderation_notes?: string
          name?: string | null
          observations: string
          proposed_stats: Json
          rarity?: Database["public"]["Enums"]["rarity"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          surroundings: string
          updated_at?: string
          user_id: string
        }
        Update: {
          submitted_name?: string | null
          submitted_description?: string | null
          legacy_stats?: Json | null
          stats_need_review?: boolean
          ai_attempts?: number
          ai_error?: string | null
          ai_result?: Json | null
          ai_started_at?: string | null
          captured_at?: string
          card_id?: string | null
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          discovery_story?: string
          final_stats?: Json | null
          found_on?: string
          id?: string
          image_path?: string
          location?: string
          moderation_notes?: string
          name?: string | null
          observations?: string
          proposed_stats?: Json
          rarity?: Database["public"]["Enums"]["rarity"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          surroundings?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_submissions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: true
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "card_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "card_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          stat_ambiente: number
          stat_komfort: number
          stat_format: number
          stat_charakter: number
          stats_need_review: boolean
          city: string
          country: string
          created_at: string
          description: string
          edition_number: number | null
          id: string
          image_url: string
          is_approved: boolean
          location: string
          name: string
          notes: string | null
          photographer_id: string
          photographer_username: string | null
          rarity: Database["public"]["Enums"]["rarity"]
          report_count: number
          stat_alter: number
          stat_flecken: number
          stat_geruch: number
          stat_kontaminierung: number
          stat_witterung: number
          total_editions: number | null
          updated_at: string
        }
        Insert: {
          stat_ambiente?: number
          stat_komfort?: number
          stat_format?: number
          stat_charakter?: number
          stats_need_review?: boolean
          city?: string
          country?: string
          created_at?: string
          description?: string
          edition_number?: number | null
          id?: string
          image_url: string
          is_approved?: boolean
          location?: string
          name: string
          notes?: string | null
          photographer_id: string
          photographer_username?: string | null
          rarity?: Database["public"]["Enums"]["rarity"]
          report_count?: number
          stat_alter?: number
          stat_flecken?: number
          stat_geruch?: number
          stat_kontaminierung?: number
          stat_witterung?: number
          total_editions?: number | null
          updated_at?: string
        }
        Update: {
          stat_ambiente?: number
          stat_komfort?: number
          stat_format?: number
          stat_charakter?: number
          stats_need_review?: boolean
          city?: string
          country?: string
          created_at?: string
          description?: string
          edition_number?: number | null
          id?: string
          image_url?: string
          is_approved?: boolean
          location?: string
          name?: string
          notes?: string | null
          photographer_id?: string
          photographer_username?: string | null
          rarity?: Database["public"]["Enums"]["rarity"]
          report_count?: number
          stat_alter?: number
          stat_flecken?: number
          stat_geruch?: number
          stat_kontaminierung?: number
          stat_witterung?: number
          total_editions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cards_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reward_claims: {
        Row: {
          claimed_at: string
          reward_day: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          reward_day: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          reward_day?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reward_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_reward_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_card_entries: {
        Row: {
          card_id: string
          created_at: string
          created_by: string
          image_path: string
          revision: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          card_id: string
          created_at?: string
          created_by: string
          image_path: string
          revision?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          card_id?: string
          created_at?: string
          created_by?: string
          image_path?: string
          revision?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_card_entries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: true
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_card_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manual_card_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_card_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manual_card_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_card_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_card_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_card_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "moderation_reports_reported_card_id_fkey"
            columns: ["reported_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          achievements_unlocked: number
          avatar_url: string | null
          ban_reason: string | null
          bio: string | null
          boosters_opened: number
          cards_collected: number
          cards_contributed: number
          coins: number
          created_at: string
          elo_rating: number
          id: string
          is_admin: boolean
          is_banned: boolean
          is_moderator: boolean
          level: number
          updated_at: string
          username: string
          xp: number
        }
        Insert: {
          achievements_unlocked?: number
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          boosters_opened?: number
          cards_collected?: number
          cards_contributed?: number
          coins?: number
          created_at?: string
          elo_rating?: number
          id: string
          is_admin?: boolean
          is_banned?: boolean
          is_moderator?: boolean
          level?: number
          updated_at?: string
          username: string
          xp?: number
        }
        Update: {
          achievements_unlocked?: number
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          boosters_opened?: number
          cards_collected?: number
          cards_contributed?: number
          coins?: number
          created_at?: string
          elo_rating?: number
          id?: string
          is_admin?: boolean
          is_banned?: boolean
          is_moderator?: boolean
          level?: number
          updated_at?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_offer_cards: {
        Row: {
          id: string
          side: string
          trade_offer_id: string
          user_card_id: string
        }
        Insert: {
          id?: string
          side: string
          trade_offer_id: string
          user_card_id: string
        }
        Update: {
          id?: string
          side?: string
          trade_offer_id?: string
          user_card_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_offer_cards_trade_offer_id_fkey"
            columns: ["trade_offer_id"]
            isOneToOne: false
            referencedRelation: "trade_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offer_cards_user_card_id_fkey"
            columns: ["user_card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_offers: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          message: string | null
          offered_coins: number
          receiver_id: string
          requested_coins: number
          sender_id: string
          status: Database["public"]["Enums"]["trade_status"]
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          offered_coins?: number
          receiver_id: string
          requested_coins?: number
          sender_id: string
          status?: Database["public"]["Enums"]["trade_status"]
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          offered_coins?: number
          receiver_id?: string
          requested_coins?: number
          sender_id?: string
          status?: Database["public"]["Enums"]["trade_status"]
        }
        Relationships: [
          {
            foreignKeyName: "trade_offers_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trade_offers_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trade_offers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cards: {
        Row: {
          collectible_condition: import('../lib/card-condition.ts').CollectibleCondition | null
          stat_modifiers: Json
          acquired_at: string
          acquisition_type: Database["public"]["Enums"]["acquisition_type"]
          card_id: string
          id: string
          is_favorite: boolean
          is_for_trade: boolean
          manual_entry_id: string | null
          trade_price: number | null
          user_id: string
        }
        Insert: {
          collectible_condition?: import('../lib/card-condition.ts').CollectibleCondition | null
          stat_modifiers?: Json
          acquired_at?: string
          acquisition_type?: Database["public"]["Enums"]["acquisition_type"]
          card_id: string
          id?: string
          is_favorite?: boolean
          is_for_trade?: boolean
          manual_entry_id?: string | null
          trade_price?: number | null
          user_id: string
        }
        Update: {
          collectible_condition?: import('../lib/card-condition.ts').CollectibleCondition | null
          stat_modifiers?: Json
          acquired_at?: string
          acquisition_type?: Database["public"]["Enums"]["acquisition_type"]
          card_id?: string
          id?: string
          is_favorite?: boolean
          is_for_trade?: boolean
          manual_entry_id?: string | null
          trade_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cards_manual_entry_id_fkey"
            columns: ["manual_entry_id"]
            isOneToOne: true
            referencedRelation: "manual_card_entries"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          cards_collected: number | null
          elo_rating: number | null
          level: number | null
          losses: number | null
          rank: number | null
          user_id: string | null
          username: string | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_daily_reward: { Args: never; Returns: Json }
      claim_submission_ai: {
        Args: { p_id: string; p_user_id: string }
        Returns: {
          submitted_name: string | null
          submitted_description: string | null
          legacy_stats: Json | null
          stats_need_review: boolean
          ai_attempts: number
          ai_error: string | null
          ai_result: Json | null
          ai_started_at: string | null
          captured_at: string
          card_id: string | null
          city: string
          country: string
          created_at: string
          description: string | null
          discovery_story: string
          final_stats: Json | null
          found_on: string
          id: string
          image_path: string
          location: string
          moderation_notes: string
          name: string | null
          observations: string
          proposed_stats: Json
          rarity: Database["public"]["Enums"]["rarity"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          surroundings: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "card_submissions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_card_submission: {
        Args: { p_data: Json; p_id: string }
        Returns: string
      }
      moderate_card_submission: {
        Args: {
          p_action: string
          p_data: Json
          p_id: string
          p_updated_at: string
        }
        Returns: string
      }
      open_booster: {
        Args: { p_booster_pack_id: string; p_request_id: string }
        Returns: Json
      }
      save_manual_card: {
        Args: {
          p_data?: Json
          p_expected_revision: number
          p_id: string
          p_image_path: string
          p_owner_id?: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      achievement_category:
        | "collection"
        | "social"
        | "trading"
        | "battles"
        | "exploration"
        | "contribution"
      acquisition_type: "booster" | "trade" | "gift" | "achievement"
      battle_status: "pending" | "active" | "finished"
      notification_type:
        | "trade_offer"
        | "trade_accepted"
        | "trade_declined"
        | "achievement_unlocked"
        | "level_up"
        | "card_approved"
        | "card_rejected"
        | "battle_challenge"
        | "battle_result"
        | "system"
      rarity: "common" | "rare" | "epic" | "legendary"
      report_reason:
        | "inappropriate_content"
        | "spam"
        | "fake_card"
        | "duplicate"
        | "copyright"
        | "other"
      report_status: "pending" | "resolved" | "dismissed"
      trade_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      achievement_category: [
        "collection",
        "social",
        "trading",
        "battles",
        "exploration",
        "contribution",
      ],
      acquisition_type: ["booster", "trade", "gift", "achievement"],
      battle_status: ["pending", "active", "finished"],
      notification_type: [
        "trade_offer",
        "trade_accepted",
        "trade_declined",
        "achievement_unlocked",
        "level_up",
        "card_approved",
        "card_rejected",
        "battle_challenge",
        "battle_result",
        "system",
      ],
      rarity: ["common", "rare", "epic", "legendary"],
      report_reason: [
        "inappropriate_content",
        "spam",
        "fake_card",
        "duplicate",
        "copyright",
        "other",
      ],
      report_status: ["pending", "resolved", "dismissed"],
      trade_status: ["pending", "accepted", "declined", "cancelled", "expired"],
    },
  },
} as const
