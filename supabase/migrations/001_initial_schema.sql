-- ============================================================
-- Matratzen Quartett – Initial Database Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE card_condition AS ENUM ('mint', 'excellent', 'good', 'fair', 'poor');
CREATE TYPE trade_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled', 'expired');
CREATE TYPE battle_status AS ENUM ('pending', 'active', 'finished');
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');
CREATE TYPE acquisition_type AS ENUM ('booster', 'trade', 'gift', 'achievement');
CREATE TYPE notification_type AS ENUM (
  'trade_offer', 'trade_accepted', 'trade_declined',
  'achievement_unlocked', 'level_up', 'card_approved',
  'card_rejected', 'battle_challenge', 'battle_result', 'system'
);
CREATE TYPE achievement_category AS ENUM (
  'collection', 'social', 'trading', 'battles', 'exploration', 'contribution'
);
CREATE TYPE report_reason AS ENUM (
  'inappropriate_content', 'spam', 'fake_card', 'duplicate', 'copyright', 'other'
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  level           INTEGER NOT NULL DEFAULT 1,
  xp              INTEGER NOT NULL DEFAULT 0,
  elo_rating      INTEGER NOT NULL DEFAULT 1000,
  coins           INTEGER NOT NULL DEFAULT 500,
  boosters_opened INTEGER NOT NULL DEFAULT 0,
  cards_collected INTEGER NOT NULL DEFAULT 0,
  cards_contributed INTEGER NOT NULL DEFAULT 0,
  achievements_unlocked INTEGER NOT NULL DEFAULT 0,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  is_moderator    BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CARDS
-- ============================================================
CREATE TABLE cards (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  rarity           rarity NOT NULL DEFAULT 'common',
  image_url        TEXT NOT NULL,
  location         TEXT NOT NULL DEFAULT '',
  city             TEXT NOT NULL DEFAULT '',
  country          TEXT NOT NULL DEFAULT 'DE',
  condition        card_condition NOT NULL DEFAULT 'good',
  stat_fluffiness  SMALLINT NOT NULL DEFAULT 50 CHECK (stat_fluffiness BETWEEN 0 AND 100),
  stat_patina      SMALLINT NOT NULL DEFAULT 50 CHECK (stat_patina BETWEEN 0 AND 100),
  stat_size        SMALLINT NOT NULL DEFAULT 50 CHECK (stat_size BETWEEN 0 AND 100),
  stat_findability SMALLINT NOT NULL DEFAULT 50 CHECK (stat_findability BETWEEN 0 AND 100),
  stat_prestige    SMALLINT NOT NULL DEFAULT 50 CHECK (stat_prestige BETWEEN 0 AND 100),
  photographer_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  is_approved      BOOLEAN NOT NULL DEFAULT FALSE,
  report_count     INTEGER NOT NULL DEFAULT 0,
  edition_number   INTEGER,
  total_editions   INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_photographer ON cards(photographer_id);
CREATE INDEX idx_cards_approved ON cards(is_approved);
CREATE INDEX idx_cards_city ON cards(city);
CREATE INDEX idx_cards_name_trgm ON cards USING GIN (name gin_trgm_ops);

-- ============================================================
-- USER CARDS (collection)
-- ============================================================
CREATE TABLE user_cards (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id          UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  acquired_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acquisition_type acquisition_type NOT NULL DEFAULT 'booster',
  is_for_trade     BOOLEAN NOT NULL DEFAULT FALSE,
  trade_price      INTEGER,
  is_favorite      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_user_cards_user ON user_cards(user_id);
CREATE INDEX idx_user_cards_card ON user_cards(card_id);
CREATE INDEX idx_user_cards_trade ON user_cards(is_for_trade) WHERE is_for_trade = TRUE;

-- ============================================================
-- BOOSTER PACKS
-- ============================================================
CREATE TABLE booster_packs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  image_url        TEXT NOT NULL DEFAULT '',
  price_coins      INTEGER NOT NULL DEFAULT 100,
  card_count       INTEGER NOT NULL DEFAULT 5,
  weight_common    NUMERIC(5,2) NOT NULL DEFAULT 60.0,
  weight_uncommon  NUMERIC(5,2) NOT NULL DEFAULT 25.0,
  weight_rare      NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  weight_epic      NUMERIC(5,2) NOT NULL DEFAULT 4.0,
  weight_legendary NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  available_until  TIMESTAMPTZ,
  limited_edition  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOSTER OPENINGS (audit log)
-- ============================================================
CREATE TABLE booster_openings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booster_pack_id  UUID NOT NULL REFERENCES booster_packs(id),
  cards_received   UUID[] NOT NULL,
  coins_spent      INTEGER NOT NULL,
  opened_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booster_openings_user ON booster_openings(user_id);

-- ============================================================
-- TRADE OFFERS
-- ============================================================
CREATE TABLE trade_offers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offered_coins   INTEGER NOT NULL DEFAULT 0,
  requested_coins INTEGER NOT NULL DEFAULT 0,
  status          trade_status NOT NULL DEFAULT 'pending',
  message         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_trade_sender ON trade_offers(sender_id);
CREATE INDEX idx_trade_receiver ON trade_offers(receiver_id);
CREATE INDEX idx_trade_status ON trade_offers(status);

-- ============================================================
-- TRADE OFFER CARDS (junction)
-- ============================================================
CREATE TABLE trade_offer_cards (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_offer_id UUID NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  user_card_id   UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  side           TEXT NOT NULL CHECK (side IN ('offered', 'requested'))
);

CREATE INDEX idx_toc_offer ON trade_offer_cards(trade_offer_id);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
CREATE TABLE achievements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key          TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  icon         TEXT NOT NULL DEFAULT '🏆',
  category     achievement_category NOT NULL DEFAULT 'collection',
  requirement  INTEGER NOT NULL DEFAULT 1,
  xp_reward    INTEGER NOT NULL DEFAULT 100,
  coin_reward  INTEGER NOT NULL DEFAULT 50,
  rarity       rarity NOT NULL DEFAULT 'common'
);

-- ============================================================
-- USER ACHIEVEMENTS
-- ============================================================
CREATE TABLE user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- ============================================================
-- BATTLES
-- ============================================================
CREATE TABLE battles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player1_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player2_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player1_deck      UUID[] NOT NULL DEFAULT '{}',
  player2_deck      UUID[] NOT NULL DEFAULT '{}',
  winner_id         UUID REFERENCES profiles(id),
  status            battle_status NOT NULL DEFAULT 'pending',
  elo_change_winner INTEGER NOT NULL DEFAULT 0,
  elo_change_loser  INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at       TIMESTAMPTZ
);

CREATE INDEX idx_battles_player1 ON battles(player1_id);
CREATE INDEX idx_battles_player2 ON battles(player2_id);
CREATE INDEX idx_battles_status ON battles(status);

-- ============================================================
-- BATTLE ROUNDS
-- ============================================================
CREATE TABLE battle_rounds (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id      UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  round_number   SMALLINT NOT NULL,
  player1_card_id UUID NOT NULL REFERENCES cards(id),
  player2_card_id UUID NOT NULL REFERENCES cards(id),
  chosen_stat    TEXT NOT NULL,
  winner_id      UUID NOT NULL REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rounds_battle ON battle_rounds(battle_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL DEFAULT 'system',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  data       JSONB,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- MODERATION REPORTS
-- ============================================================
CREATE TABLE moderation_reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_card_id  UUID REFERENCES cards(id) ON DELETE SET NULL,
  reported_user_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason            report_reason NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  status            report_status NOT NULL DEFAULT 'pending',
  resolved_by       UUID REFERENCES profiles(id),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reported_card_id IS NOT NULL OR reported_user_id IS NOT NULL)
);

CREATE INDEX idx_reports_status ON moderation_reports(status);
CREATE INDEX idx_reports_reporter ON moderation_reports(reporter_id);

-- ============================================================
-- PUSH SUBSCRIPTIONS (Web Push API)
-- ============================================================
CREATE TABLE push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

-- ============================================================
-- LEADERBOARD VIEW
-- ============================================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY p.elo_rating DESC) AS rank,
  p.id AS user_id,
  p.username,
  p.avatar_url,
  p.elo_rating,
  p.level,
  p.cards_collected,
  COUNT(b_win.id) AS wins,
  COUNT(b_loss.id) AS losses
FROM profiles p
LEFT JOIN battles b_win  ON b_win.winner_id = p.id AND b_win.status = 'finished'
LEFT JOIN battles b_loss ON (b_loss.player1_id = p.id OR b_loss.player2_id = p.id)
  AND b_loss.status = 'finished'
  AND b_loss.winner_id != p.id
WHERE p.is_banned = FALSE
GROUP BY p.id, p.username, p.avatar_url, p.elo_rating, p.level, p.cards_collected;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE booster_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE booster_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- profiles: public read, own write
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- cards: approved cards are public; unapproved only for admin/photographer
CREATE POLICY "Approved cards are public"
  ON cards FOR SELECT USING (is_approved = true OR photographer_id = auth.uid());
CREATE POLICY "Authenticated users can insert cards"
  ON cards FOR INSERT WITH CHECK (auth.uid() = photographer_id);
CREATE POLICY "Photographers can update own pending cards"
  ON cards FOR UPDATE USING (photographer_id = auth.uid() AND is_approved = false);

-- user_cards: own collection only
CREATE POLICY "Users can view own collection"
  ON user_cards FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Trade-listed cards are public"
  ON user_cards FOR SELECT USING (is_for_trade = true);
CREATE POLICY "Users manage own user_cards"
  ON user_cards FOR ALL USING (user_id = auth.uid());

-- booster_packs: public read
CREATE POLICY "Booster packs are public"
  ON booster_packs FOR SELECT USING (true);

-- booster_openings: own only
CREATE POLICY "Users view own openings"
  ON booster_openings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own openings"
  ON booster_openings FOR INSERT WITH CHECK (user_id = auth.uid());

-- trade_offers: sender and receiver
CREATE POLICY "Trade participants can view offers"
  ON trade_offers FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Sender can create offers"
  ON trade_offers FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Participants can update offers"
  ON trade_offers FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- achievements: public read
CREATE POLICY "Achievements are public"
  ON achievements FOR SELECT USING (true);

-- user_achievements: own + public
CREATE POLICY "User achievements viewable by all"
  ON user_achievements FOR SELECT USING (true);
CREATE POLICY "System inserts user achievements"
  ON user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());

-- battles: public read
CREATE POLICY "Battles are viewable"
  ON battles FOR SELECT USING (true);
CREATE POLICY "Players can create battles"
  ON battles FOR INSERT WITH CHECK (player1_id = auth.uid());

-- notifications: own only
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

-- moderation_reports: own + moderators
CREATE POLICY "Users view own reports"
  ON moderation_reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Users create reports"
  ON moderation_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- push_subscriptions: own only
CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS – auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER – create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url, coins)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    500
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA – Booster Packs
-- ============================================================
INSERT INTO booster_packs (name, description, price_coins, card_count,
  weight_common, weight_uncommon, weight_rare, weight_epic, weight_legendary,
  is_available, limited_edition)
VALUES
  ('Standard Pack', 'Das klassische Booster-Pack mit 5 Karten.', 100, 5,
   60, 25, 10, 4, 1, true, false),
  ('Premium Pack', 'Erhöhte Chancen auf seltene Karten!', 250, 5,
   40, 30, 20, 8, 2, true, false),
  ('Mega Pack', '10 Karten mit garantierter seltener Karte.', 400, 10,
   35, 30, 25, 8, 2, true, false),
  ('Legendary Pack', 'Garantierte epische oder legendäre Karte!', 1000, 5,
   0, 20, 40, 30, 10, true, false);

-- ============================================================
-- SEED DATA – Achievements
-- ============================================================
INSERT INTO achievements (key, name, description, icon, category, requirement, xp_reward, coin_reward, rarity)
VALUES
  ('first_card',       'Erste Karte',       'Erhalte deine erste Matratzen-Karte.',                 '🛏️', 'collection',    1,   100,  50,  'common'),
  ('collector_10',     'Sammler',           'Sammle 10 verschiedene Karten.',                        '📦', 'collection',   10,   200, 100,  'common'),
  ('collector_50',     'Großer Sammler',    'Sammle 50 verschiedene Karten.',                        '🗃️', 'collection',   50,   500, 200, 'uncommon'),
  ('collector_100',    'Matratzen-Experte', 'Sammle 100 verschiedene Karten.',                       '🏅', 'collection',  100,  1000, 500,    'rare'),
  ('collector_250',    'Matratzen-Meister', 'Sammle 250 verschiedene Karten.',                       '🏆', 'collection',  250,  2500, 1000,  'epic'),
  ('first_trade',      'Erster Handel',     'Führe deinen ersten Kartenhandel durch.',               '🤝', 'trading',       1,   150, 100,  'common'),
  ('trader_10',        'Händler',           'Schließe 10 Trades ab.',                                '💱', 'trading',      10,   300, 150, 'uncommon'),
  ('first_battle',     'Erster Kampf',      'Kämpfe zum ersten Mal.',                                '⚔️', 'battles',       1,   150, 100,  'common'),
  ('winner_10',        'Kämpfer',           'Gewinne 10 Kämpfe.',                                    '🥊', 'battles',      10,   400, 200, 'uncommon'),
  ('winner_50',        'Champion',          'Gewinne 50 Kämpfe.',                                    '🥇', 'battles',      50,  1000, 500,    'rare'),
  ('photographer',     'Fotograf',          'Reiche deine erste Karte ein.',                         '📸', 'contribution',  1,   200, 150,  'common'),
  ('photographer_10',  'Straßenfotograf',   'Reiche 10 Karten ein.',                                 '🎨', 'contribution', 10,   500, 300, 'uncommon'),
  ('booster_10',       'Booster-Fan',       'Öffne 10 Booster-Packs.',                              '🎁', 'collection',   10,   200, 100,  'common'),
  ('booster_50',       'Pack-Junkie',       'Öffne 50 Booster-Packs.',                              '🎰', 'collection',   50,   600, 300, 'uncommon'),
  ('legendary_card',   'Legendär',          'Erhalte eine legendäre Karte.',                        '⭐', 'collection',    1,   500, 250,    'rare'),
  ('cities_5',         'Stadterkunder',     'Sammle Karten aus 5 verschiedenen Städten.',            '🗺️', 'exploration',   5,   300, 150, 'uncommon'),
  ('cities_20',        'Weltreisender',     'Sammle Karten aus 20 verschiedenen Städten.',           '✈️', 'exploration',  20,  1000, 500,    'rare'),
  ('elo_1200',         'Aufsteiger',        'Erreiche ein Elo-Rating von 1200.',                    '📈', 'battles',    1200,   500, 250,  'common'),
  ('elo_1500',         'Profi',             'Erreiche ein Elo-Rating von 1500.',                    '🔥', 'battles',    1500,  1000, 500, 'uncommon'),
  ('elo_2000',         'Grandmaster',       'Erreiche ein Elo-Rating von 2000.',                    '👑', 'battles',    2000,  2500, 1000, 'legendary');
