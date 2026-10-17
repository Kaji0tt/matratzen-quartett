DO $$ BEGIN
  IF to_regprocedure('public.protect_profile_economy()') IS NULL
    OR to_regprocedure('public.protect_collection_ownership()') IS NULL THEN
    RAISE EXCEPTION 'Migration 004_secure_game_economy must be applied first';
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE FUNCTION private.can_review_submissions()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND NOT is_banned AND (is_admin OR is_moderator)
  );
$$;
REVOKE ALL ON FUNCTION private.can_review_submissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_review_submissions() TO authenticated;

CREATE FUNCTION private.valid_submission_stats(p_stats JSONB)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE SET search_path = ''
AS $$
  SELECT CASE WHEN jsonb_typeof(p_stats) = 'object' THEN
    (SELECT count(*) = 5 AND bool_and(
      key IN ('alter', 'flecken', 'witterung', 'geruch', 'kontaminierung')
      AND CASE WHEN jsonb_typeof(value) = 'number'
        THEN value::TEXT::NUMERIC BETWEEN 0 AND 100
          AND trunc(value::TEXT::NUMERIC) = value::TEXT::NUMERIC
        ELSE FALSE END
    ) FROM jsonb_each(p_stats))
  ELSE FALSE END;
$$;
REVOKE ALL ON FUNCTION private.valid_submission_stats(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.valid_submission_stats(JSONB) TO authenticated, service_role;

CREATE TABLE public.card_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  image_path TEXT NOT NULL UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL,
  city TEXT NOT NULL CHECK (length(trim(city)) BETWEEN 2 AND 100),
  location TEXT NOT NULL CHECK (length(trim(location)) BETWEEN 2 AND 150),
  country TEXT NOT NULL DEFAULT 'DE' CHECK (country ~ '^[A-Z]{2}$'),
  found_on DATE NOT NULL CHECK (found_on >= DATE '2000-01-01'),
  condition public.card_condition NOT NULL,
  observations TEXT NOT NULL CHECK (length(trim(observations)) BETWEEN 10 AND 1200),
  surroundings TEXT NOT NULL CHECK (length(trim(surroundings)) BETWEEN 3 AND 600),
  discovery_story TEXT NOT NULL DEFAULT '' CHECK (length(discovery_story) <= 600),
  proposed_stats JSONB NOT NULL CHECK (private.valid_submission_stats(proposed_stats)),
  status TEXT NOT NULL DEFAULT 'pending_ai'
    CHECK (status IN ('pending_ai', 'ai_reviewing', 'ai_failed', 'pending_review', 'publishing', 'approved', 'rejected')),
  ai_result JSONB,
  ai_error TEXT,
  ai_attempts INTEGER NOT NULL DEFAULT 0 CHECK (ai_attempts BETWEEN 0 AND 3),
  ai_started_at TIMESTAMPTZ,
  name TEXT,
  description TEXT,
  final_stats JSONB CHECK (final_stats IS NULL OR private.valid_submission_stats(final_stats)),
  rarity public.rarity NOT NULL DEFAULT 'common',
  moderation_notes TEXT NOT NULL DEFAULT '' CHECK (length(moderation_notes) <= 1500),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  card_id UUID UNIQUE REFERENCES public.cards(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'approved' OR (card_id IS NOT NULL AND reviewed_by IS NOT NULL)),
  CHECK (status NOT IN ('pending_review', 'publishing', 'approved') OR ai_result IS NOT NULL)
);
CREATE INDEX card_submissions_user_created ON public.card_submissions(user_id, created_at DESC);
CREATE INDEX card_submissions_queue ON public.card_submissions(status, created_at);
CREATE INDEX card_submissions_reviewer ON public.card_submissions(reviewed_by);
ALTER TABLE public.card_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.card_submissions FROM anon, authenticated;
GRANT SELECT ON public.card_submissions TO authenticated;
GRANT ALL ON public.card_submissions TO service_role;
CREATE POLICY "Owners and reviewers read submissions"
  ON public.card_submissions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.can_review_submissions()));
CREATE TRIGGER card_submissions_updated_at BEFORE UPDATE ON public.card_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.card_generation_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  style_guide TEXT NOT NULL CHECK (length(trim(style_guide)) BETWEEN 20 AND 6000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.card_generation_settings (style_guide) VALUES (
  'Deutsch, knapp, trocken und liebevoll absurd. Street-Art trifft Quartett: Bordsteinjuwelen, Fundstücke und verlorener Luxus. Gib der Matratze einen einprägsamen Namen und eine kurze Fund-Legende. Der Witz gilt der Matratze, nie Personen oder Bevölkerungsgruppen. Keine personenbezogenen Daten, keine Tatsachen erfinden; Geruch und Kontaminierung sind spielerische Schätzwerte, keine Gesundheitsdiagnose.'
);
ALTER TABLE public.card_generation_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.card_generation_settings FROM anon, authenticated;
GRANT SELECT, UPDATE (style_guide) ON public.card_generation_settings TO authenticated;
GRANT ALL ON public.card_generation_settings TO service_role;
CREATE POLICY "Reviewers read generation settings" ON public.card_generation_settings
  FOR SELECT TO authenticated USING ((SELECT private.can_review_submissions()));
CREATE POLICY "Admins update generation settings" ON public.card_generation_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin AND NOT is_banned))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin AND NOT is_banned));
CREATE TRIGGER card_generation_settings_updated_at BEFORE UPDATE ON public.card_generation_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('submission-images', 'submission-images', FALSE, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Owners upload submission photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'submission-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND NOT is_banned)
);
CREATE POLICY "Owners and reviewers read submission photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'submission-images' AND (
  (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT OR (SELECT private.can_review_submissions())
));
CREATE POLICY "Owners remove unused submission photos" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'submission-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND NOT EXISTS (SELECT 1 FROM public.card_submissions WHERE image_path = storage.objects.name)
);

-- New cards may only enter the catalogue through reviewed submissions.
DROP POLICY IF EXISTS "Authenticated users can insert cards" ON public.cards;
DROP POLICY IF EXISTS "Photographers can update own pending cards" ON public.cards;
REVOKE INSERT, UPDATE, DELETE ON public.cards FROM anon, authenticated;

CREATE FUNCTION private.create_card_submission(p_id UUID, p_data JSONB)
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
  IF EXISTS (SELECT 1 FROM public.card_submissions WHERE id = p_id AND user_id = v_user) THEN
    RETURN p_id;
  END IF;
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
  INSERT INTO public.card_submissions (
    id, user_id, image_path, captured_at, city, location, country, found_on, condition,
    observations, surroundings, discovery_story, proposed_stats
  ) VALUES (
    p_id, v_user, v_path, (p_data->>'captured_at')::TIMESTAMPTZ,
    trim(p_data->>'city'), trim(p_data->>'location'), p_data->>'country',
    (p_data->>'found_on')::DATE, (p_data->>'condition')::public.card_condition,
    trim(p_data->>'observations'), trim(p_data->>'surroundings'),
    coalesce(trim(p_data->>'discovery_story'), ''), p_data->'proposed_stats'
  );
  RETURN p_id;
END;
$$;
REVOKE ALL ON FUNCTION private.create_card_submission(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.create_card_submission(UUID, JSONB) TO authenticated;
CREATE FUNCTION public.create_card_submission(p_id UUID, p_data JSONB)
RETURNS UUID LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.create_card_submission(p_id, p_data); $$;
REVOKE ALL ON FUNCTION public.create_card_submission(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_card_submission(UUID, JSONB) TO authenticated;

CREATE FUNCTION public.claim_submission_ai(p_id UUID, p_user_id UUID)
RETURNS SETOF public.card_submissions LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  UPDATE public.card_submissions
  SET status = 'ai_reviewing', ai_attempts = ai_attempts + 1, ai_started_at = now(), ai_error = NULL
  WHERE id = p_id AND user_id = p_user_id AND ai_attempts < 3
    AND (status IN ('pending_ai', 'ai_failed')
      OR (status = 'ai_reviewing' AND ai_started_at < now() - INTERVAL '2 minutes'))
  RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_submission_ai(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_submission_ai(UUID, UUID) TO service_role;

CREATE FUNCTION private.moderate_card_submission(
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
      stat_alter, stat_flecken, stat_witterung, stat_geruch, stat_kontaminierung, is_approved
    ) VALUES (
      trim(p_data->>'name'), trim(p_data->>'description'), (p_data->>'rarity')::public.rarity,
      p_data->>'image_url', s.location, s.city, s.country, s.condition, s.user_id,
      (v_stats->>'alter')::INTEGER, (v_stats->>'flecken')::INTEGER,
      (v_stats->>'witterung')::INTEGER, (v_stats->>'geruch')::INTEGER,
      (v_stats->>'kontaminierung')::INTEGER, TRUE
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
    moderation_notes = coalesce(p_data->>'notes', ''),
    status = CASE WHEN p_action = 'approve' THEN 'approved' WHEN p_action = 'publish' THEN 'publishing' ELSE 'pending_review' END,
    card_id = v_card, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_id;
  RETURN v_card;
END;
$$;
REVOKE ALL ON FUNCTION private.moderate_card_submission(UUID, TIMESTAMPTZ, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.moderate_card_submission(UUID, TIMESTAMPTZ, TEXT, JSONB) TO authenticated;
CREATE FUNCTION public.moderate_card_submission(p_id UUID, p_updated_at TIMESTAMPTZ, p_action TEXT, p_data JSONB)
RETURNS UUID LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.moderate_card_submission(p_id, p_updated_at, p_action, p_data); $$;
REVOKE ALL ON FUNCTION public.moderate_card_submission(UUID, TIMESTAMPTZ, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_card_submission(UUID, TIMESTAMPTZ, TEXT, JSONB) TO authenticated;