-- Keep production balances and collection ownership behind trusted database operations.
-- Apply manually only after reviewing on a non-production Supabase project first.

CREATE OR REPLACE FUNCTION public.protect_profile_economy()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
    AND auth.uid() = OLD.id
    AND (
      NEW.coins IS DISTINCT FROM OLD.coins
      OR NEW.xp IS DISTINCT FROM OLD.xp
      OR NEW.level IS DISTINCT FROM OLD.level
      OR NEW.elo_rating IS DISTINCT FROM OLD.elo_rating
      OR NEW.boosters_opened IS DISTINCT FROM OLD.boosters_opened
      OR NEW.cards_collected IS DISTINCT FROM OLD.cards_collected
      OR NEW.cards_contributed IS DISTINCT FROM OLD.cards_contributed
      OR NEW.achievements_unlocked IS DISTINCT FROM OLD.achievements_unlocked
      OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
      OR NEW.is_moderator IS DISTINCT FROM OLD.is_moderator
      OR NEW.is_banned IS DISTINCT FROM OLD.is_banned
      OR NEW.ban_reason IS DISTINCT FROM OLD.ban_reason
    )
  THEN
    RAISE EXCEPTION 'Profile economy and privilege fields can only be changed by trusted server operations'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_economy_fields ON public.profiles;
CREATE TRIGGER protect_profile_economy_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_economy();

CREATE OR REPLACE FUNCTION public.protect_collection_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP <> 'UPDATE' THEN
    RAISE EXCEPTION 'Collection ownership can only be changed by trusted server operations'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.card_id IS DISTINCT FROM OLD.card_id
    OR NEW.acquisition_type IS DISTINCT FROM OLD.acquisition_type
    OR NEW.acquired_at IS DISTINCT FROM OLD.acquired_at
  THEN
    RAISE EXCEPTION 'Collection ownership can only be changed by trusted server operations'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_collection_ownership_fields ON public.user_cards;
CREATE TRIGGER protect_collection_ownership_fields
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION public.protect_collection_ownership();

DROP POLICY IF EXISTS "Users manage own user_cards" ON public.user_cards;
CREATE POLICY "Users update own collection preferences"
  ON public.user_cards FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.daily_reward_claims (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_day DATE NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, reward_day)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_coins_nonnegative'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_coins_nonnegative CHECK (coins >= 0);
  END IF;
END;
$$;

ALTER TABLE public.daily_reward_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.daily_reward_claims FROM anon, authenticated;
GRANT SELECT ON public.daily_reward_claims TO authenticated;
CREATE POLICY "Users view own daily reward claims"
  ON public.daily_reward_claims FOR SELECT
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.booster_opening_requests (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID NOT NULL,
  booster_opening_id UUID NOT NULL UNIQUE REFERENCES public.booster_openings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, request_id)
);

ALTER TABLE public.booster_openings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own openings" ON public.booster_openings;
ALTER TABLE public.booster_opening_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booster_opening_requests FROM anon, authenticated;
GRANT SELECT ON public.booster_opening_requests TO authenticated;
CREATE POLICY "Users view own booster opening requests"
  ON public.booster_opening_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.claim_daily_reward()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_coins INTEGER;
  v_claimed_user_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '42501';
  END IF;

  SELECT coins INTO v_coins
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  INSERT INTO public.daily_reward_claims (user_id, reward_day)
  VALUES (v_user_id, CURRENT_DATE)
  ON CONFLICT DO NOTHING
  RETURNING user_id INTO v_claimed_user_id;

  IF v_claimed_user_id IS NULL THEN
    RETURN jsonb_build_object('claimed', FALSE, 'coins', v_coins);
  END IF;

  UPDATE public.profiles
  SET coins = coins + 50
  WHERE id = v_user_id
  RETURNING coins INTO v_coins;

  RETURN jsonb_build_object('claimed', TRUE, 'reward', 50, 'coins', v_coins);
END;
$$;

CREATE OR REPLACE FUNCTION public.open_booster(
  p_booster_pack_id UUID,
  p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pack public.booster_packs%ROWTYPE;
  v_coins INTEGER;
  v_opening_id UUID;
  v_existing_coins_spent INTEGER;
  v_cards UUID[] := ARRAY[]::UUID[];
  v_card_id UUID;
  v_rarity public.rarity;
  v_slot INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'An idempotency request ID is required';
  END IF;

  SELECT coins INTO v_coins
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT opening.id, opening.cards_received, opening.coins_spent
  INTO v_opening_id, v_cards, v_existing_coins_spent
  FROM public.booster_opening_requests AS request
  JOIN public.booster_openings AS opening ON opening.id = request.booster_opening_id
  WHERE request.user_id = v_user_id AND request.request_id = p_request_id;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'opening_id', v_opening_id,
      'card_ids', to_jsonb(v_cards),
      'coins_spent', v_existing_coins_spent,
      'replayed', TRUE
    );
  END IF;

  SELECT * INTO v_pack
  FROM public.booster_packs
  WHERE id = p_booster_pack_id
    AND is_available
    AND (available_until IS NULL OR available_until > NOW())
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booster pack is unavailable';
  END IF;
  IF v_pack.price_coins < 0 OR v_pack.card_count < 1 OR v_pack.card_count > 20
    OR v_pack.weight_common < 0 OR v_pack.weight_uncommon < 0
    OR v_pack.weight_rare < 0 OR v_pack.weight_epic < 0
    OR v_pack.weight_legendary < 0
    OR v_pack.weight_common + v_pack.weight_uncommon + v_pack.weight_rare
      + v_pack.weight_epic + v_pack.weight_legendary <= 0
  THEN
    RAISE EXCEPTION 'Booster pack configuration is invalid';
  END IF;
  IF v_coins < v_pack.price_coins THEN
    RAISE EXCEPTION 'Not enough coins' USING ERRCODE = '22023';
  END IF;

  FOR v_slot IN 1..v_pack.card_count LOOP
    WITH rarity_weights(rarity, weight, rarity_rank) AS (
      VALUES
        ('common'::public.rarity, v_pack.weight_common, 0),
        ('uncommon'::public.rarity, v_pack.weight_uncommon, 1),
        ('rare'::public.rarity, v_pack.weight_rare, 2),
        ('epic'::public.rarity, v_pack.weight_epic, 3),
        ('legendary'::public.rarity, v_pack.weight_legendary, 4)
    ),
    eligible AS (
      SELECT candidate.rarity, candidate.weight, candidate.rarity_rank
      FROM rarity_weights AS candidate
      WHERE candidate.weight > 0
        AND (
          v_slot > 1
          OR (
            v_pack.name NOT ILIKE '%mega%' AND v_pack.name NOT ILIKE '%legendary%'
          )
          OR (
            v_pack.name ILIKE '%mega%' AND candidate.rarity_rank >= 2
          )
          OR (
            v_pack.name ILIKE '%legendary%' AND candidate.rarity_rank >= 3
          )
        )
        AND EXISTS (
          SELECT 1 FROM public.cards AS available
          WHERE available.is_approved AND available.rarity = candidate.rarity
        )
    ),
    weighted AS (
      SELECT
        rarity,
        SUM(weight) OVER (ORDER BY rarity_rank) AS cumulative_weight,
        SUM(weight) OVER () AS total_weight
      FROM eligible
    )
    SELECT rarity INTO v_rarity
    FROM weighted
    WHERE cumulative_weight >= random() * total_weight
    ORDER BY cumulative_weight
    LIMIT 1;

    IF v_rarity IS NULL THEN
      RAISE EXCEPTION 'No approved cards are available for this booster configuration';
    END IF;

    SELECT id INTO v_card_id
    FROM public.cards
    WHERE is_approved AND rarity = v_rarity
    ORDER BY random()
    LIMIT 1;
    IF v_card_id IS NULL THEN
      RAISE EXCEPTION 'No approved card is available for selected rarity';
    END IF;
    v_cards := array_append(v_cards, v_card_id);
    v_rarity := NULL;
    v_card_id := NULL;
  END LOOP;

  UPDATE public.profiles
  SET
    coins = coins - v_pack.price_coins,
    boosters_opened = boosters_opened + 1,
    cards_collected = cards_collected + v_pack.card_count
  WHERE id = v_user_id;

  INSERT INTO public.user_cards (user_id, card_id, acquisition_type)
  SELECT v_user_id, received.card_id, 'booster'::public.acquisition_type
  FROM unnest(v_cards) AS received(card_id);

  INSERT INTO public.booster_openings (
    user_id, booster_pack_id, cards_received, coins_spent
  )
  VALUES (v_user_id, p_booster_pack_id, v_cards, v_pack.price_coins)
  RETURNING id INTO v_opening_id;

  INSERT INTO public.booster_opening_requests (user_id, request_id, booster_opening_id)
  VALUES (v_user_id, p_request_id, v_opening_id);

  RETURN jsonb_build_object(
    'opening_id', v_opening_id,
    'card_ids', to_jsonb(v_cards),
    'coins_spent', v_pack.price_coins,
    'replayed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_daily_reward() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.open_booster(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_reward() TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_booster(UUID, UUID) TO authenticated;