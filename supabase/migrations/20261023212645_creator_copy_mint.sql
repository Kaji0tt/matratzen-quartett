BEGIN;

DROP TRIGGER assign_collectible_condition ON public.user_cards;

UPDATE public.user_cards AS copy
SET collectible_condition = 'mint'
FROM public.cards AS card
WHERE copy.card_id = card.id
  AND (copy.manual_entry_id IS NOT NULL
    OR (copy.acquisition_type = 'gift' AND copy.user_id = card.photographer_id))
  AND copy.collectible_condition IS DISTINCT FROM 'mint';

CREATE OR REPLACE FUNCTION public.assign_collectible_condition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.manual_entry_id IS NOT NULL OR (
      NEW.acquisition_type = 'gift' AND EXISTS (
        SELECT 1 FROM public.cards WHERE id = NEW.card_id AND photographer_id = NEW.user_id
      )
    ) THEN
      NEW.collectible_condition := 'mint';
    ELSIF NEW.acquisition_type = 'booster' THEN
      NEW.collectible_condition := (ARRAY[
        'mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor'
      ])[1 + floor(random() * 7)::INTEGER];
    END IF;
  ELSIF NEW.collectible_condition IS DISTINCT FROM OLD.collectible_condition THEN
    RAISE EXCEPTION 'The collectible condition is assigned once and cannot be changed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_collectible_condition
  BEFORE INSERT OR UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION public.assign_collectible_condition();

COMMENT ON COLUMN public.user_cards.collectible_condition IS
  'Condition of this copy, independent of the mattress. Creator gifts and editor copies are Mint; booster copies are randomly graded once. Other legacy copies may be ungraded.';

NOTIFY pgrst, 'reload schema';
COMMIT;