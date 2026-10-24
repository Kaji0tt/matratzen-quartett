BEGIN;

ALTER TABLE public.cards
  ADD COLUMN photographer_username TEXT,
  ADD CONSTRAINT cards_photographer_username_check CHECK (
    photographer_username IS NULL OR (
      photographer_username = btrim(photographer_username)
      AND length(photographer_username) BETWEEN 1 AND 50
      AND photographer_username !~ E'[\r\n]'
    )
  );

CREATE FUNCTION private.set_manual_card_photographer(p_id UUID, p_photographer_username TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_review_submissions() THEN
    RAISE EXCEPTION 'Admin- oder Moderationsrechte erforderlich' USING ERRCODE = '42501';
  END IF;
  IF length(coalesce(p_photographer_username, '')) > 50
    OR coalesce(p_photographer_username, '') ~ E'[\r\n]' THEN
    RAISE EXCEPTION 'Der Fotografen-Credit darf höchstens 50 Zeichen enthalten' USING ERRCODE = '22023';
  END IF;
  UPDATE public.cards
  SET photographer_username = nullif(trim(p_photographer_username), '')
  WHERE id = p_id
    AND EXISTS (SELECT 1 FROM public.manual_card_entries WHERE card_id = p_id);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Manuelle Karte nicht gefunden' USING ERRCODE = '22023';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION private.set_manual_card_photographer(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.set_manual_card_photographer(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_manual_card(
  p_id UUID, p_expected_revision INTEGER, p_image_path TEXT,
  p_owner_id UUID DEFAULT NULL, p_data JSONB DEFAULT '{}'
)
RETURNS UUID LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_id UUID;
BEGIN
  v_id := private.save_manual_card(p_id, p_expected_revision, p_image_path, p_owner_id, p_data);
  PERFORM private.set_manual_card_photographer(p_id, p_data->>'photographer_username');
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_manual_card(UUID, INTEGER, TEXT, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_manual_card(UUID, INTEGER, TEXT, UUID, JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;