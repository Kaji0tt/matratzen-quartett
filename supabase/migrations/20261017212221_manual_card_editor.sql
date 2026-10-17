CREATE TABLE public.manual_card_entries (
  card_id UUID PRIMARY KEY REFERENCES public.cards(id) ON DELETE RESTRICT,
  image_path TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  updated_by UUID NOT NULL REFERENCES public.profiles(id),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX manual_card_entries_creator ON public.manual_card_entries(created_by);
CREATE INDEX manual_card_entries_editor ON public.manual_card_entries(updated_by);
CREATE INDEX manual_card_entries_updated ON public.manual_card_entries(updated_at DESC, card_id);
ALTER TABLE public.manual_card_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.manual_card_entries FROM anon, authenticated;
GRANT SELECT ON public.manual_card_entries TO authenticated;
GRANT ALL ON public.manual_card_entries TO service_role;
CREATE POLICY "Reviewers read manual card entries" ON public.manual_card_entries
  FOR SELECT TO authenticated USING ((SELECT private.can_review_submissions()));

ALTER TABLE public.user_cards
  ADD COLUMN manual_entry_id UUID UNIQUE REFERENCES public.manual_card_entries(card_id) ON DELETE RESTRICT,
  ADD CONSTRAINT manual_copy_matches_card CHECK (manual_entry_id IS NULL OR manual_entry_id = card_id),
  ADD CONSTRAINT manual_copy_not_tradeable CHECK (
    manual_entry_id IS NULL OR (NOT is_for_trade AND trade_price IS NULL)
  );
CREATE POLICY "Reviewers read linked manual copies" ON public.user_cards
  FOR SELECT TO authenticated
  USING (manual_entry_id IS NOT NULL AND (SELECT private.can_review_submissions()));

CREATE FUNCTION private.protect_manual_copy()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND (
    (TG_OP = 'INSERT' AND NEW.manual_entry_id IS NOT NULL)
    OR (TG_OP = 'UPDATE' AND NEW.manual_entry_id IS DISTINCT FROM OLD.manual_entry_id)
  ) THEN
    RAISE EXCEPTION 'Editor-Verknüpfungen dürfen nur im Karteneditor geändert werden' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.protect_manual_copy() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_manual_copy_link BEFORE INSERT OR UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION private.protect_manual_copy();

CREATE FUNCTION private.prevent_manual_copy_trade()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_cards WHERE id = NEW.user_card_id AND manual_entry_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Die verknüpfte Editor-Kopie ist nicht handelbar' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.prevent_manual_copy_trade() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER prevent_manual_copy_trade BEFORE INSERT OR UPDATE ON public.trade_offer_cards
  FOR EACH ROW EXECUTE FUNCTION private.prevent_manual_copy_trade();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('manual-card-images', 'manual-card-images', TRUE, 5242880, ARRAY['image/png']);
CREATE POLICY "Reviewers upload manual PNGs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'manual-card-images' AND (SELECT private.can_review_submissions())
    AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.png$'
  );
CREATE POLICY "Manual PNGs are readable" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'manual-card-images');

CREATE FUNCTION private.save_manual_card(
  p_id UUID, p_expected_revision INTEGER, p_image_path TEXT, p_owner_id UUID, p_data JSONB
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_entry public.manual_card_entries%ROWTYPE;
  v_copy public.user_cards%ROWTYPE;
  v_existing BOOLEAN;
  v_old_owner UUID;
  v_stats JSONB := p_data->'stats';
  v_total INTEGER;
  v_high INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_review_submissions() THEN
    RAISE EXCEPTION 'Admin- oder Moderationsrechte erforderlich' USING ERRCODE = '42501';
  END IF;
  IF p_id IS NULL OR p_expected_revision IS NULL OR p_expected_revision < 0 THEN
    RAISE EXCEPTION 'Karten-ID und Bearbeitungsstand erforderlich';
  END IF;
  -- Also serializes two creates with the same client-generated ID.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_id::TEXT, 0));
  SELECT * INTO v_entry FROM public.manual_card_entries WHERE card_id = p_id FOR UPDATE;
  v_existing := FOUND;
  IF (v_existing AND v_entry.revision <> p_expected_revision)
    OR (NOT v_existing AND p_expected_revision <> 0) THEN
    RAISE EXCEPTION 'Die Karte wurde inzwischen geändert. Bitte den aktuellen Stand neu laden.' USING ERRCODE = '40001';
  END IF;
  IF NOT coalesce(private.valid_submission_stats(v_stats), FALSE)
    OR length(trim(coalesce(p_data->>'name', ''))) NOT BETWEEN 2 AND 80
    OR length(trim(coalesce(p_data->>'description', ''))) NOT BETWEEN 10 AND 1000
    OR length(trim(coalesce(p_data->>'city', ''))) NOT BETWEEN 2 AND 100
    OR length(trim(coalesce(p_data->>'location', ''))) NOT BETWEEN 2 AND 150
    OR coalesce(p_data->>'country', '') !~ '^[A-Z]{2}$'
    OR coalesce(p_data->>'condition', '') NOT IN ('mint','excellent','good','fair','poor')
    OR coalesce(p_data->>'rarity', '') NOT IN ('common','uncommon','rare','epic','legendary')
    OR length(coalesce(p_data->>'notes', '')) > 1500 THEN
    RAISE EXCEPTION 'Bitte gültige Kartendaten und alle fünf Stats angeben' USING ERRCODE = '22023';
  END IF;
  SELECT sum(value::TEXT::INTEGER), count(*) FILTER (WHERE value::TEXT::INTEGER > 85)
    INTO v_total, v_high FROM jsonb_each(v_stats);
  IF v_total > 300 OR v_high > 1 THEN
    RAISE EXCEPTION 'Balancing: maximal 300 Gesamtpunkte und höchstens ein Wert über 85' USING ERRCODE = '22023';
  END IF;
  IF p_image_path IS NULL
    OR p_image_path !~ ('^' || p_id::TEXT || '/[0-9a-f-]{36}\.png$')
    OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'manual-card-images' AND name = p_image_path)
    OR coalesce(p_data->>'image_url', '') NOT LIKE 'https://%'
    OR right(coalesce(p_data->>'image_url', ''), length('/storage/v1/object/public/manual-card-images/' || p_image_path))
      <> '/storage/v1/object/public/manual-card-images/' || p_image_path THEN
    RAISE EXCEPTION 'Bitte zuerst ein PNG für diese Karte hochladen' USING ERRCODE = '22023';
  END IF;
  IF v_existing THEN
    SELECT * INTO v_copy FROM public.user_cards WHERE manual_entry_id = p_id;
    v_old_owner := v_copy.user_id;
  END IF;
  -- Counter updates and opposite-direction transfers lock profiles in the same order.
  PERFORM id FROM public.profiles WHERE id IN (v_old_owner, p_owner_id) ORDER BY id FOR UPDATE;
  IF p_owner_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_owner_id AND NOT is_banned
  ) THEN
    RAISE EXCEPTION 'Der gewählte Besitzer existiert nicht oder ist gesperrt' USING ERRCODE = '22023';
  END IF;
  IF NOT v_existing THEN
    INSERT INTO public.cards (
      id, name, description, rarity, image_url, location, city, country, condition, notes,
      stat_alter, stat_flecken, stat_witterung, stat_geruch, stat_kontaminierung,
      photographer_id, is_approved
    ) VALUES (
      p_id, trim(p_data->>'name'), trim(p_data->>'description'), (p_data->>'rarity')::public.rarity,
      p_data->>'image_url', trim(p_data->>'location'), trim(p_data->>'city'), p_data->>'country',
      (p_data->>'condition')::public.card_condition, coalesce(p_data->>'notes', ''),
      (v_stats->>'alter')::INTEGER, (v_stats->>'flecken')::INTEGER, (v_stats->>'witterung')::INTEGER,
      (v_stats->>'geruch')::INTEGER, (v_stats->>'kontaminierung')::INTEGER, auth.uid(), TRUE
    );
    INSERT INTO public.manual_card_entries (card_id, image_path, created_by, updated_by)
    VALUES (p_id, p_image_path, auth.uid(), auth.uid());
  ELSE
    UPDATE public.cards SET
      name = trim(p_data->>'name'), description = trim(p_data->>'description'),
      rarity = (p_data->>'rarity')::public.rarity, image_url = p_data->>'image_url',
      location = trim(p_data->>'location'), city = trim(p_data->>'city'), country = p_data->>'country',
      condition = (p_data->>'condition')::public.card_condition, notes = coalesce(p_data->>'notes', ''),
      stat_alter = (v_stats->>'alter')::INTEGER, stat_flecken = (v_stats->>'flecken')::INTEGER,
      stat_witterung = (v_stats->>'witterung')::INTEGER, stat_geruch = (v_stats->>'geruch')::INTEGER,
      stat_kontaminierung = (v_stats->>'kontaminierung')::INTEGER
    WHERE id = p_id;
    UPDATE public.manual_card_entries SET image_path = p_image_path, updated_by = auth.uid(),
      revision = revision + 1, updated_at = clock_timestamp() WHERE card_id = p_id;
  END IF;
  IF v_old_owner IS DISTINCT FROM p_owner_id THEN
    IF v_copy.id IS NOT NULL THEN
      IF p_owner_id IS NULL THEN
        DELETE FROM public.user_cards WHERE id = v_copy.id;
      ELSE
        UPDATE public.user_cards SET user_id = p_owner_id, acquired_at = now(),
          is_favorite = FALSE WHERE id = v_copy.id;
      END IF;
    ELSIF p_owner_id IS NOT NULL THEN
      INSERT INTO public.user_cards (user_id, card_id, acquisition_type, manual_entry_id)
      VALUES (p_owner_id, p_id, 'gift', p_id);
    END IF;
    IF v_old_owner IS NOT NULL THEN
      UPDATE public.profiles SET cards_collected = cards_collected - 1 WHERE id = v_old_owner;
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (v_old_owner, 'system', 'Editor-Kopie neu zugeordnet',
        'Die verwaltete Kopie von ' || trim(p_data->>'name') || ' wurde aus deiner Sammlung entfernt.',
        jsonb_build_object('card_id', p_id));
    END IF;
    IF p_owner_id IS NOT NULL THEN
      UPDATE public.profiles SET cards_collected = cards_collected + 1 WHERE id = p_owner_id;
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (p_owner_id, 'system', 'Neue Editor-Kopie',
        'Eine fest zugeordnete Kopie von ' || trim(p_data->>'name') || ' gehört jetzt dir.',
        jsonb_build_object('card_id', p_id));
    END IF;
  END IF;
  RETURN p_id;
END;
$$;
REVOKE ALL ON FUNCTION private.save_manual_card(UUID, INTEGER, TEXT, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.save_manual_card(UUID, INTEGER, TEXT, UUID, JSONB) TO authenticated;
CREATE FUNCTION public.save_manual_card(
  p_id UUID, p_expected_revision INTEGER, p_image_path TEXT, p_owner_id UUID, p_data JSONB
)
RETURNS UUID LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.save_manual_card(p_id, p_expected_revision, p_image_path, p_owner_id, p_data); $$;
REVOKE ALL ON FUNCTION public.save_manual_card(UUID, INTEGER, TEXT, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_manual_card(UUID, INTEGER, TEXT, UUID, JSONB) TO authenticated;