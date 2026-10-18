BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TYPE public.rarity RENAME TO rarity_legacy;
CREATE TYPE public.rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

ALTER TABLE public.cards ALTER COLUMN rarity DROP DEFAULT;
ALTER TABLE public.cards ALTER COLUMN rarity TYPE public.rarity
  USING (CASE WHEN rarity::TEXT = 'uncommon' THEN 'common' ELSE rarity::TEXT END)::public.rarity;
ALTER TABLE public.cards ALTER COLUMN rarity SET DEFAULT 'common'::public.rarity;

ALTER TABLE public.achievements ALTER COLUMN rarity DROP DEFAULT;
ALTER TABLE public.achievements ALTER COLUMN rarity TYPE public.rarity
  USING (CASE WHEN rarity::TEXT = 'uncommon' THEN 'common' ELSE rarity::TEXT END)::public.rarity;
ALTER TABLE public.achievements ALTER COLUMN rarity SET DEFAULT 'common'::public.rarity;

ALTER TABLE public.card_submissions ALTER COLUMN rarity DROP DEFAULT;
ALTER TABLE public.card_submissions ALTER COLUMN rarity TYPE public.rarity
  USING (CASE WHEN rarity::TEXT = 'uncommon' THEN 'common' ELSE rarity::TEXT END)::public.rarity;
ALTER TABLE public.card_submissions ALTER COLUMN rarity SET DEFAULT 'common'::public.rarity;

DROP TYPE public.rarity_legacy;

ALTER TABLE public.booster_packs ALTER COLUMN weight_common TYPE NUMERIC(6,2);
ALTER TABLE public.booster_packs ALTER COLUMN weight_common SET DEFAULT 85.0;
UPDATE public.booster_packs SET weight_common = weight_common + weight_uncommon;
ALTER TABLE public.booster_packs DROP COLUMN weight_uncommon;

CREATE OR REPLACE FUNCTION public.open_booster(p_booster_pack_id UUID, p_request_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
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
  SELECT coins INTO v_coins FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  SELECT opening.id, opening.cards_received, opening.coins_spent
    INTO v_opening_id, v_cards, v_existing_coins_spent
  FROM public.booster_opening_requests AS request
  JOIN public.booster_openings AS opening ON opening.id = request.booster_opening_id
  WHERE request.user_id = v_user_id AND request.request_id = p_request_id;
  IF FOUND THEN
    RETURN jsonb_build_object('opening_id', v_opening_id, 'card_ids', to_jsonb(v_cards),
      'coins_spent', v_existing_coins_spent, 'replayed', TRUE);
  END IF;
  SELECT * INTO v_pack FROM public.booster_packs
  WHERE id = p_booster_pack_id AND is_available
    AND (available_until IS NULL OR available_until > NOW())
  FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booster pack is unavailable'; END IF;
  IF v_pack.price_coins < 0 OR v_pack.card_count < 1 OR v_pack.card_count > 20
    OR v_pack.weight_common < 0 OR v_pack.weight_rare < 0 OR v_pack.weight_epic < 0
    OR v_pack.weight_legendary < 0
    OR v_pack.weight_common + v_pack.weight_rare + v_pack.weight_epic + v_pack.weight_legendary <= 0 THEN
    RAISE EXCEPTION 'Booster pack configuration is invalid';
  END IF;
  IF v_coins < v_pack.price_coins THEN
    RAISE EXCEPTION 'Not enough coins' USING ERRCODE = '22023';
  END IF;
  FOR v_slot IN 1..v_pack.card_count LOOP
    WITH rarity_weights(rarity, weight, rarity_rank) AS (
      VALUES
        ('common'::public.rarity, v_pack.weight_common, 0),
        ('rare'::public.rarity, v_pack.weight_rare, 1),
        ('epic'::public.rarity, v_pack.weight_epic, 2),
        ('legendary'::public.rarity, v_pack.weight_legendary, 3)
    ),
    eligible AS (
      SELECT candidate.rarity, candidate.weight, candidate.rarity_rank
      FROM rarity_weights AS candidate
      WHERE candidate.weight > 0 AND (
        v_slot > 1 OR (v_pack.name NOT ILIKE '%mega%' AND v_pack.name NOT ILIKE '%legendary%')
        OR (v_pack.name ILIKE '%mega%' AND candidate.rarity_rank >= 1)
        OR (v_pack.name ILIKE '%legendary%' AND candidate.rarity_rank >= 2)
      )
      AND EXISTS (
        SELECT 1 FROM public.cards AS available WHERE available.is_approved AND available.rarity = candidate.rarity
      )
    ),
    weighted AS (
      SELECT rarity, SUM(weight) OVER (ORDER BY rarity_rank) AS cumulative_weight,
        SUM(weight) OVER () AS total_weight FROM eligible
    )
    SELECT rarity INTO v_rarity FROM weighted
    WHERE cumulative_weight >= random() * total_weight ORDER BY cumulative_weight LIMIT 1;
    IF v_rarity IS NULL THEN
      RAISE EXCEPTION 'No approved cards are available for this booster configuration';
    END IF;
    SELECT id INTO v_card_id FROM public.cards WHERE is_approved AND rarity = v_rarity ORDER BY random() LIMIT 1;
    IF v_card_id IS NULL THEN RAISE EXCEPTION 'No approved card is available for selected rarity'; END IF;
    v_cards := array_append(v_cards, v_card_id);
    v_rarity := NULL;
    v_card_id := NULL;
  END LOOP;
  UPDATE public.profiles SET coins = coins - v_pack.price_coins, boosters_opened = boosters_opened + 1,
    cards_collected = cards_collected + v_pack.card_count WHERE id = v_user_id;
  INSERT INTO public.user_cards (user_id, card_id, acquisition_type)
    SELECT v_user_id, received.card_id, 'booster'::public.acquisition_type FROM unnest(v_cards) AS received(card_id);
  INSERT INTO public.booster_openings (user_id, booster_pack_id, cards_received, coins_spent)
    VALUES (v_user_id, p_booster_pack_id, v_cards, v_pack.price_coins) RETURNING id INTO v_opening_id;
  INSERT INTO public.booster_opening_requests (user_id, request_id, booster_opening_id)
    VALUES (v_user_id, p_request_id, v_opening_id);
  RETURN jsonb_build_object('opening_id', v_opening_id, 'card_ids', to_jsonb(v_cards),
    'coins_spent', v_pack.price_coins, 'replayed', FALSE);
END;
$$;
REVOKE ALL ON FUNCTION public.open_booster(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_booster(UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;