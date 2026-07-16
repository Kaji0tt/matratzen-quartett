export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type CardCondition = 'mint' | 'excellent' | 'good' | 'fair' | 'poor'

export interface Card {
  id: string
  name: string
  description: string
  rarity: Rarity
  image_url: string
  location: string
  city: string
  country: string
  condition: CardCondition
  stats: CardStats
  notes?: string
  photographer_id: string
  photographer_username: string
  created_at: string
  is_approved: boolean
  report_count: number
  edition_number?: number
  total_editions?: number
  attributes: CardAttribute[]
}

export interface CardStats {
  alter: number          // Alter der Matratze (0-100)
  flecken: number        // Menge/Intensität von Flecken (0-100)
  witterung: number      // UV-Schäden, Verwitterung, Verformung (0-100)
  geruch: number         // Muffigkeit, Geruchsintensität (0-100)
  kontaminierung: number // Hygiene-Risiko / Kontaminierung (0-100)
}

export interface CardAttribute {
  key: string
  value: string
}

export interface UserCard {
  id: string
  user_id: string
  card_id: string
  card: Card
  acquired_at: string
  acquisition_type: 'booster' | 'trade' | 'gift' | 'achievement'
  is_for_trade: boolean
  trade_price?: number
  is_favorite: boolean
}

export interface User {
  id: string
  username: string
  avatar_url?: string
  bio?: string
  level: number
  xp: number
  xp_to_next_level: number
  elo_rating: number
  coins: number
  boosters_opened: number
  cards_collected: number
  cards_contributed: number
  achievements_unlocked: number
  created_at: string
  is_admin: boolean
  is_moderator: boolean
  is_banned: boolean
  ban_reason?: string
}

export interface BoosterPack {
  id: string
  name: string
  description: string
  image_url: string
  price_coins: number
  card_count: number
  rarity_weights: RarityWeights
  is_available: boolean
  available_until?: string
  limited_edition: boolean
}

export interface RarityWeights {
  common: number
  uncommon: number
  rare: number
  epic: number
  legendary: number
}

export interface TradeOffer {
  id: string
  sender_id: string
  sender_username: string
  receiver_id: string
  receiver_username: string
  offered_cards: UserCard[]
  requested_cards: UserCard[]
  offered_coins: number
  requested_coins: number
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
  message?: string
  created_at: string
  expires_at: string
}

export interface Achievement {
  id: string
  key: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  requirement: number
  xp_reward: number
  coin_reward: number
  rarity: Rarity
}

export type AchievementCategory =
  | 'collection'
  | 'social'
  | 'trading'
  | 'battles'
  | 'exploration'
  | 'contribution'

export interface UserAchievement {
  achievement: Achievement
  unlocked_at: string
  progress: number
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url?: string
  elo_rating: number
  level: number
  cards_collected: number
  wins: number
  losses: number
  win_rate: number
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export type NotificationType =
  | 'trade_offer'
  | 'trade_accepted'
  | 'trade_declined'
  | 'achievement_unlocked'
  | 'level_up'
  | 'card_approved'
  | 'card_rejected'
  | 'battle_challenge'
  | 'battle_result'
  | 'system'

export interface ModerationReport {
  id: string
  reporter_id: string
  reported_card_id?: string
  reported_user_id?: string
  reason: ReportReason
  description: string
  status: 'pending' | 'resolved' | 'dismissed'
  resolved_by?: string
  resolved_at?: string
  created_at: string
}

export type ReportReason =
  | 'inappropriate_content'
  | 'spam'
  | 'fake_card'
  | 'duplicate'
  | 'copyright'
  | 'other'

export interface Battle {
  id: string
  player1_id: string
  player2_id: string
  player1_username: string
  player2_username: string
  player1_deck: string[]
  player2_deck: string[]
  winner_id?: string
  status: 'pending' | 'active' | 'finished'
  elo_change_winner: number
  elo_change_loser: number
  created_at: string
  finished_at?: string
  rounds: BattleRound[]
}

export interface BattleRound {
  round_number: number
  player1_card_id: string
  player2_card_id: string
  chosen_stat: keyof CardStats
  winner_id: string
}
