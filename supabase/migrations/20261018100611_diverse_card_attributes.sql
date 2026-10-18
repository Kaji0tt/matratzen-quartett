BEGIN;

ALTER TABLE public.cards
  ADD COLUMN stat_ambiente INTEGER NOT NULL DEFAULT 50 CHECK (stat_ambiente BETWEEN 0 AND 100),
  ADD COLUMN stat_komfort INTEGER NOT NULL DEFAULT 50 CHECK (stat_komfort BETWEEN 0 AND 100),
  ADD COLUMN stat_format INTEGER NOT NULL DEFAULT 50 CHECK (stat_format BETWEEN 0 AND 100),
  ADD COLUMN stat_charakter INTEGER NOT NULL DEFAULT 50 CHECK (stat_charakter BETWEEN 0 AND 100),
  ADD COLUMN stats_need_review BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE public.cards SET stats_need_review = TRUE;
COMMENT ON COLUMN public.cards.stat_alter IS 'Legacy value, no longer used in gameplay';
COMMENT ON COLUMN public.cards.stat_flecken IS 'Legacy value, no longer used in gameplay';
COMMENT ON COLUMN public.cards.stat_geruch IS 'Legacy value, no longer used in gameplay';
COMMENT ON COLUMN public.cards.stat_kontaminierung IS 'Legacy value, no longer used in gameplay';

ALTER TABLE public.card_submissions
  ADD COLUMN submitted_name TEXT CHECK (submitted_name IS NULL OR length(trim(submitted_name)) BETWEEN 2 AND 80),
  ADD COLUMN submitted_description TEXT CHECK (submitted_description IS NULL OR length(trim(submitted_description)) BETWEEN 10 AND 1000),
  ADD COLUMN legacy_stats JSONB,
  ADD COLUMN stats_need_review BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION private.valid_submission_stats(p_stats JSONB)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE SET search_path = ''
AS $$
  SELECT CASE WHEN jsonb_typeof(p_stats) = 'object' THEN
    (SELECT count(*) = 5 AND bool_and(
      key IN ('witterung', 'ambiente', 'komfort', 'format', 'charakter')
      AND CASE WHEN jsonb_typeof(value) = 'number'
        THEN value::TEXT::NUMERIC BETWEEN 0 AND 100
          AND trunc(value::TEXT::NUMERIC) = value::TEXT::NUMERIC
        ELSE FALSE END
    ) FROM jsonb_each(p_stats))
  ELSE FALSE END;
$$;

-- Keep historical values and AI results for audit; do not relabel dirt as character or ambience.
UPDATE public.card_submissions SET
  legacy_stats = jsonb_build_object('proposed', proposed_stats, 'final', final_stats),
  proposed_stats = jsonb_build_object('witterung', proposed_stats->'witterung',
    'ambiente', 50, 'komfort', 50, 'format', 50, 'charakter', 50),
  final_stats = CASE WHEN final_stats IS NULL THEN NULL ELSE
    jsonb_build_object('witterung', final_stats->'witterung',
      'ambiente', 50, 'komfort', 50, 'format', 50, 'charakter', 50) END,
  name = coalesce(name, 'Fund aus ' || city),
  description = coalesce(description, left(observations, 1000)),
  stats_need_review = TRUE;

UPDATE public.card_generation_settings SET style_guide =
  'Deutsch, knapp, trocken und liebevoll absurd. Street-Art trifft Quartett: Bordsteinjuwelen, Fundstücke und verlorener Luxus. Individuelle Spielertexte und Humor erhalten. Der Witz gilt der Matratze, nie Personen oder Bevölkerungsgruppen. Keine personenbezogenen Daten oder erfundenen Tatsachen. Dies ist ein Bewertungsmaßstab, kein Auftrag zum Neuschreiben.'
WHERE style_guide =
  'Deutsch, knapp, trocken und liebevoll absurd. Street-Art trifft Quartett: Bordsteinjuwelen, Fundstücke und verlorener Luxus. Gib der Matratze einen einprägsamen Namen und eine kurze Fund-Legende. Der Witz gilt der Matratze, nie Personen oder Bevölkerungsgruppen. Keine personenbezogenen Daten, keine Tatsachen erfinden; Geruch und Kontaminierung sind spielerische Schätzwerte, keine Gesundheitsdiagnose.';

CREATE OR REPLACE FUNCTION private.create_card_submission(p_id UUID, p_data JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_path TEXT := v_user::TEXT || '/' || p_id::TEXT || '.jpg';
BEGIN
  IF v_user IS NULL OR p_id IS NULL THEN
    RAISE EXCEPTION 'Anmeldung und Einreichungs-ID erforderlich' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.profiles WHERE id = v_user AND NOT is_banned FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil nicht verfügbar' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.card_submissions WHERE id = p_id AND user_id = v_user) THEN RETURN p_id; END IF;
  IF (SELECT count(*) FROM public.card_submissions WHERE user_id = v_user AND created_at > now() - INTERVAL '1 day') >= 10 THEN
    RAISE EXCEPTION 'Maximal 10 Einreichungen pro 24 Stunden';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'submission-images' AND name = v_path) THEN
    RAISE EXCEPTION 'Das Kamerafoto fehlt';
  END IF;
  IF (p_data->>'found_on')::DATE > CURRENT_DATE
    OR (p_data->>'captured_at')::TIMESTAMPTZ > now() + INTERVAL '5 minutes'
    OR (p_data->>'captured_at')::TIMESTAMPTZ < now() - INTERVAL '1 day' THEN
    RAISE EXCEPTION 'Ungültiges Fund- oder Aufnahmedatum';
  END IF;
  IF length(trim(coalesce(p_data->>'name', ''))) NOT BETWEEN 2 AND 80
    OR length(trim(coalesce(p_data->>'description', ''))) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION 'Bitte eigenen Kartennamen (2–80 Zeichen) und Beschreibung (10–1000 Zeichen) angeben';
  END IF;
  INSERT INTO public.card_submissions (
    id, user_id, image_path, captured_at, city, location, country, found_on, condition,
    observations, surroundings, discovery_story, proposed_stats,
    submitted_name, submitted_description, name, description
  ) VALUES (
    p_id, v_user, v_path, (p_data->>'captured_at')::TIMESTAMPTZ,
    trim(p_data->>'city'), trim(p_data->>'location'), p_data->>'country',
    (p_data->>'found_on')::DATE, (p_data->>'condition')::public.card_condition,
    trim(p_data->>'observations'), trim(p_data->>'surroundings'),
    coalesce(trim(p_data->>'discovery_story'), ''), p_data->'proposed_stats',
    trim(p_data->>'name'), trim(p_data->>'description'), trim(p_data->>'name'), trim(p_data->>'description')
  );
  RETURN p_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.moderate_card_submission(
  p_id UUID, p_updated_at TIMESTAMPTZ, p_action TEXT, p_data JSONB
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  s public.card_submissions%ROWTYPE;
  v_card UUID;
  v_stats JSONB := p_data->'stats';
  v_total INTEGER;
  v_high INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_review_submissions() THEN
    RAISE EXCEPTION 'Moderationsrechte erforderlich' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO STRICT s FROM public.card_submissions WHERE id = p_id FOR UPDATE;
  IF s.status = 'approved' AND p_action = 'approve' THEN RETURN s.card_id; END IF;
  IF s.status IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Bereits abgeschlossen'; END IF;
  IF s.updated_at IS DISTINCT FROM p_updated_at THEN
    RAISE EXCEPTION 'Die Einreichung wurde verändert. Bitte neu laden.';
  END IF;
  IF p_action NOT IN ('save', 'publish', 'approve', 'reject') OR p_action IS NULL THEN
    RAISE EXCEPTION 'Ungültige Moderationsaktion';
  END IF;
  IF (s.status = 'publishing' AND p_action <> 'approve')
    OR (p_action = 'approve' AND s.status <> 'publishing') THEN
    RAISE EXCEPTION 'Die Veröffentlichung muss abgeschlossen werden';
  END IF;
  IF length(coalesce(p_data->>'notes', '')) > 1500 THEN RAISE EXCEPTION 'Prüfnotiz zu lang'; END IF;
  IF p_action = 'reject' THEN
    IF length(trim(coalesce(p_data->>'notes', ''))) < 3 THEN RAISE EXCEPTION 'Bitte Ablehnung begründen'; END IF;
    UPDATE public.card_submissions SET status = 'rejected', moderation_notes = p_data->>'notes',
      reviewed_by = auth.uid(), reviewed_at = now() WHERE id = p_id;
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (s.user_id, 'card_rejected', 'Fund nicht freigegeben', p_data->>'notes', jsonb_build_object('submission_id', s.id));
    RETURN NULL;
  END IF;
  IF s.status NOT IN ('pending_review', 'publishing') OR s.ai_result IS NULL THEN
    RAISE EXCEPTION 'Zuerst muss die KI-Prüfung erfolgreich abgeschlossen sein';
  END IF;
  IF NOT coalesce(private.valid_submission_stats(v_stats), FALSE)
    OR length(trim(coalesce(p_data->>'name', ''))) NOT BETWEEN 2 AND 80
    OR length(trim(coalesce(p_data->>'description', ''))) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION 'Name, Text oder Stats ungültig';
  END IF;
  SELECT sum(value::TEXT::INTEGER), count(*) FILTER (WHERE value::TEXT::INTEGER > 85)
    INTO v_total, v_high FROM jsonb_each(v_stats);
  IF v_total > 300 OR v_high > 1 THEN
    RAISE EXCEPTION 'Balancing: höchstens 300 Gesamtpunkte und ein Wert über 85';
  END IF;
  IF p_action = 'approve' THEN
    IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'card-images' AND name = 'approved/' || s.id || '.jpg')
      OR p_data->>'image_url' IS NULL
      OR right(p_data->>'image_url', length('/storage/v1/object/public/card-images/approved/' || s.id || '.jpg'))
        <> '/storage/v1/object/public/card-images/approved/' || s.id || '.jpg' THEN
      RAISE EXCEPTION 'Veröffentlichtes Bild fehlt';
    END IF;
    INSERT INTO public.cards (
      name, description, rarity, image_url, location, city, country, condition, photographer_id,
      stat_witterung, stat_ambiente, stat_komfort, stat_format, stat_charakter, is_approved
    ) VALUES (
      trim(p_data->>'name'), trim(p_data->>'description'), (p_data->>'rarity')::public.rarity,
      p_data->>'image_url', s.location, s.city, s.country, s.condition, s.user_id,
      (v_stats->>'witterung')::INTEGER, (v_stats->>'ambiente')::INTEGER,
      (v_stats->>'komfort')::INTEGER, (v_stats->>'format')::INTEGER,
      (v_stats->>'charakter')::INTEGER, TRUE
    ) RETURNING id INTO v_card;
    INSERT INTO public.user_cards (user_id, card_id, acquisition_type) VALUES (s.user_id, v_card, 'gift');
    UPDATE public.profiles SET cards_contributed = cards_contributed + 1,
      cards_collected = cards_collected + 1 WHERE id = s.user_id;
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (s.user_id, 'card_approved', 'Dein Fund ist im Spiel!',
      'Eine Kopie von ' || trim(p_data->>'name') || ' gehört jetzt dir.',
      jsonb_build_object('submission_id', s.id, 'card_id', v_card));
  END IF;
  UPDATE public.card_submissions SET name = trim(p_data->>'name'), description = trim(p_data->>'description'),
    final_stats = v_stats, rarity = (p_data->>'rarity')::public.rarity,
    moderation_notes = coalesce(p_data->>'notes', ''), stats_need_review = FALSE,
    status = CASE WHEN p_action = 'approve' THEN 'approved' WHEN p_action = 'publish' THEN 'publishing' ELSE 'pending_review' END,
    card_id = v_card, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_id;
  RETURN v_card;
END;
$$;

CREATE OR REPLACE FUNCTION private.save_manual_card(
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
  PERFORM id FROM public.profiles WHERE id IN (v_old_owner, p_owner_id) ORDER BY id FOR UPDATE;
  IF p_owner_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_owner_id AND NOT is_banned
  ) THEN
    RAISE EXCEPTION 'Der gewählte Besitzer existiert nicht oder ist gesperrt' USING ERRCODE = '22023';
  END IF;
  IF NOT v_existing THEN
    INSERT INTO public.cards (
      id, name, description, rarity, image_url, location, city, country, condition, notes,
      stat_witterung, stat_ambiente, stat_komfort, stat_format, stat_charakter,
      photographer_id, is_approved
    ) VALUES (
      p_id, trim(p_data->>'name'), trim(p_data->>'description'), (p_data->>'rarity')::public.rarity,
      p_data->>'image_url', trim(p_data->>'location'), trim(p_data->>'city'), p_data->>'country',
      (p_data->>'condition')::public.card_condition, coalesce(p_data->>'notes', ''),
      (v_stats->>'witterung')::INTEGER, (v_stats->>'ambiente')::INTEGER, (v_stats->>'komfort')::INTEGER,
      (v_stats->>'format')::INTEGER, (v_stats->>'charakter')::INTEGER, auth.uid(), TRUE
    );
    INSERT INTO public.manual_card_entries (card_id, image_path, created_by, updated_by)
    VALUES (p_id, p_image_path, auth.uid(), auth.uid());
  ELSE
    UPDATE public.cards SET
      name = trim(p_data->>'name'), description = trim(p_data->>'description'),
      rarity = (p_data->>'rarity')::public.rarity, image_url = p_data->>'image_url',
      location = trim(p_data->>'location'), city = trim(p_data->>'city'), country = p_data->>'country',
      condition = (p_data->>'condition')::public.card_condition, notes = coalesce(p_data->>'notes', ''),
      stat_witterung = (v_stats->>'witterung')::INTEGER, stat_ambiente = (v_stats->>'ambiente')::INTEGER,
      stat_komfort = (v_stats->>'komfort')::INTEGER, stat_format = (v_stats->>'format')::INTEGER,
      stat_charakter = (v_stats->>'charakter')::INTEGER, stats_need_review = FALSE
    WHERE id = p_id;
    UPDATE public.manual_card_entries SET image_path = p_image_path, updated_by = auth.uid(),
      revision = revision + 1, updated_at = clock_timestamp() WHERE card_id = p_id;
  END IF;
  IF v_old_owner IS DISTINCT FROM p_owner_id THEN
    IF v_copy.id IS NOT NULL THEN
      IF p_owner_id IS NULL THEN
        DELETE FROM public.user_cards WHERE id = v_copy.id;
      ELSE
        UPDATE public.user_cards SET user_id = p_owner_id, acquired_at = now(), is_favorite = FALSE WHERE id = v_copy.id;
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

COMMIT;