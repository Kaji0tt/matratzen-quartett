BEGIN;

ALTER TABLE public.user_cards
  ADD COLUMN collectible_condition TEXT
  CHECK (collectible_condition IN ('mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor'));

COMMENT ON COLUMN public.user_cards.collectible_condition IS
  'Physical condition of this collectible copy, independent of cards.condition (mattress). NULL means ungraded. Assigned once for new booster copies.';

CREATE FUNCTION public.assign_collectible_condition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.acquisition_type = 'booster' THEN
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

REVOKE ALL ON FUNCTION public.assign_collectible_condition() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER assign_collectible_condition
  BEFORE INSERT OR UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION public.assign_collectible_condition();

NOTIFY pgrst, 'reload schema';
COMMIT;