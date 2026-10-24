BEGIN;

ALTER TABLE public.user_cards
  ADD COLUMN stat_modifiers JSONB NOT NULL DEFAULT '{"witterung": 0, "flecken": 0, "ambiente": 0, "komfort": 0, "charakter": 0}'::JSONB,
  ADD CONSTRAINT user_cards_stat_modifiers_valid CHECK (
    jsonb_typeof(stat_modifiers) = 'object'
    AND stat_modifiers ?& ARRAY['witterung', 'flecken', 'ambiente', 'komfort', 'charakter']
    AND stat_modifiers - ARRAY['witterung', 'flecken', 'ambiente', 'komfort', 'charakter'] = '{}'::JSONB
    AND jsonb_typeof(stat_modifiers -> 'witterung') = 'number'
    AND stat_modifiers ->> 'witterung' ~ '^-?[0-5]$'
    AND jsonb_typeof(stat_modifiers -> 'flecken') = 'number'
    AND stat_modifiers ->> 'flecken' ~ '^-?[0-5]$'
    AND jsonb_typeof(stat_modifiers -> 'ambiente') = 'number'
    AND stat_modifiers ->> 'ambiente' ~ '^-?[0-5]$'
    AND jsonb_typeof(stat_modifiers -> 'komfort') = 'number'
    AND stat_modifiers ->> 'komfort' ~ '^-?[0-5]$'
    AND jsonb_typeof(stat_modifiers -> 'charakter') = 'number'
    AND stat_modifiers ->> 'charakter' ~ '^-?[0-5]$'
  );

ALTER TABLE public.user_cards
  DROP CONSTRAINT user_cards_collectible_condition_check,
  ADD CONSTRAINT user_cards_collectible_condition_check CHECK (
    collectible_condition IN ('mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor', 'editor')
  );

COMMENT ON COLUMN public.user_cards.stat_modifiers IS
  'Immutable per-copy stat rolls. Effective stats are max(0, card base stat + modifier); no upper cap. Collectible condition is derived from the sum of all five modifiers.';

CREATE FUNCTION public.collectible_condition_for_modifier_total(p_total INTEGER)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_total >= 20 THEN 'mint'
    WHEN p_total >= 14 THEN 'near_mint'
    WHEN p_total >= 8 THEN 'excellent'
    WHEN p_total >= -7 THEN 'good'
    WHEN p_total >= -13 THEN 'light_played'
    WHEN p_total >= -19 THEN 'played'
    ELSE 'poor'
  END;
$$;
REVOKE ALL ON FUNCTION public.collectible_condition_for_modifier_total(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.collectible_condition_for_modifier_total(INTEGER) TO authenticated;

DROP TRIGGER assign_collectible_condition ON public.user_cards;

WITH rolled AS MATERIALIZED (
  SELECT copy.id,
    CASE WHEN copy.manual_entry_id IS NOT NULL THEN
      '{"witterung": 0, "flecken": 0, "ambiente": 0, "komfort": 0, "charakter": 0}'::JSONB
    ELSE jsonb_build_object(
      'witterung', floor(random() * 11)::INTEGER - 5,
      'flecken', floor(random() * 11)::INTEGER - 5,
      'ambiente', floor(random() * 11)::INTEGER - 5,
      'komfort', floor(random() * 11)::INTEGER - 5,
      'charakter', floor(random() * 11)::INTEGER - 5
    ) END AS modifiers
  FROM public.user_cards AS copy
)
UPDATE public.user_cards AS copy
SET stat_modifiers = rolled.modifiers,
    collectible_condition = CASE
      WHEN copy.manual_entry_id IS NOT NULL THEN 'editor'
      ELSE public.collectible_condition_for_modifier_total(
        (rolled.modifiers ->> 'witterung')::INTEGER
        + (rolled.modifiers ->> 'flecken')::INTEGER
        + (rolled.modifiers ->> 'ambiente')::INTEGER
        + (rolled.modifiers ->> 'komfort')::INTEGER
        + (rolled.modifiers ->> 'charakter')::INTEGER
      )
    END
FROM rolled
WHERE copy.id = rolled.id;

CREATE OR REPLACE FUNCTION public.assign_collectible_condition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_total INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.manual_entry_id IS NOT NULL THEN
      NEW.stat_modifiers := '{"witterung": 0, "flecken": 0, "ambiente": 0, "komfort": 0, "charakter": 0}'::JSONB;
      NEW.collectible_condition := 'editor';
    ELSE
      NEW.stat_modifiers := jsonb_build_object(
        'witterung', floor(random() * 11)::INTEGER - 5,
        'flecken', floor(random() * 11)::INTEGER - 5,
        'ambiente', floor(random() * 11)::INTEGER - 5,
        'komfort', floor(random() * 11)::INTEGER - 5,
        'charakter', floor(random() * 11)::INTEGER - 5
      );
      v_total := (NEW.stat_modifiers ->> 'witterung')::INTEGER
        + (NEW.stat_modifiers ->> 'flecken')::INTEGER
        + (NEW.stat_modifiers ->> 'ambiente')::INTEGER
        + (NEW.stat_modifiers ->> 'komfort')::INTEGER
        + (NEW.stat_modifiers ->> 'charakter')::INTEGER;
      NEW.collectible_condition := public.collectible_condition_for_modifier_total(v_total);
    END IF;
  ELSIF NEW.stat_modifiers IS DISTINCT FROM OLD.stat_modifiers
    OR NEW.collectible_condition IS DISTINCT FROM OLD.collectible_condition THEN
    RAISE EXCEPTION 'The collectible condition and stat modifiers are assigned once and cannot be changed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_collectible_condition() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER assign_collectible_condition
  BEFORE INSERT OR UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION public.assign_collectible_condition();

COMMENT ON COLUMN public.user_cards.collectible_condition IS
  'Condition of this copy, derived from its five immutable stat modifiers. Mint >= +20; Near Mint +14..+19; Excellent +8..+13; Good -7..+7; Light Played -13..-8; Played -19..-14; Poor <= -20. Editor copies have zero modifiers and the separate Editor condition.';

NOTIFY pgrst, 'reload schema';
COMMIT;