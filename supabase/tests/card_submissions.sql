-- Run with psql -v ON_ERROR_STOP=1 against a migrated test database. No rows persist.
BEGIN;
CREATE FUNCTION pg_temp.expect_error(p_sql TEXT, p_state TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    IF p_state IS NOT NULL AND SQLSTATE <> p_state THEN
      RAISE EXCEPTION 'Expected %, got %: %', p_state, SQLSTATE, SQLERRM;
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'Expected an error for %', p_sql;
END;
$$;

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('91000000-0000-0000-0000-000000000001', 'mq_submission_owner@example.invalid', '{"username":"mq_submission_owner"}'),
  ('91000000-0000-0000-0000-000000000002', 'mq_submission_other@example.invalid', '{"username":"mq_submission_other"}'),
  ('91000000-0000-0000-0000-000000000003', 'mq_submission_mod@example.invalid', '{"username":"mq_submission_mod"}'),
  ('91000000-0000-0000-0000-000000000004', 'mq_submission_admin@example.invalid', '{"username":"mq_submission_admin"}');
UPDATE public.profiles SET is_moderator = TRUE WHERE id = '91000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET is_admin = TRUE WHERE id = '91000000-0000-0000-0000-000000000004';
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('submission-images', '91000000-0000-0000-0000-000000000001/92000000-0000-0000-0000-000000000001.jpg'),
  ('submission-images', '91000000-0000-0000-0000-000000000001/92000000-0000-0000-0000-000000000002.jpg');
SELECT set_config('test.submission_data', jsonb_build_object(
  'captured_at', now(), 'city', 'Berlin', 'location', 'Bordstein',
  'country', 'DE', 'found_on', CURRENT_DATE, 'condition', 'fair',
  'observations', 'Viele Flecken, eine Ecke eingerissen',
  'name', 'Meine Bordsteinliege', 'description', 'Sie wartet unter der Laterne auf den nächsten Umzug.',
  'surroundings', 'Unter einer Laterne', 'discovery_story', 'Beim Spaziergang entdeckt',
  'proposed_stats', '{"witterung":100,"ambiente":100,"komfort":100,"format":100,"charakter":100}'::JSONB
)::TEXT, TRUE);

SET LOCAL ROLE anon;
SELECT pg_temp.expect_error($q$SELECT public.create_card_submission(
  '92000000-0000-0000-0000-000000000001', current_setting('test.submission_data')::JSONB)$q$, '42501');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000001', TRUE);
SET LOCAL ROLE authenticated;
SELECT public.create_card_submission('92000000-0000-0000-0000-000000000001', current_setting('test.submission_data')::JSONB);
-- Retrying the same request does not create another submission.
SELECT public.create_card_submission('92000000-0000-0000-0000-000000000001', current_setting('test.submission_data')::JSONB);
SELECT public.create_card_submission('92000000-0000-0000-0000-000000000002', current_setting('test.submission_data')::JSONB);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.card_submissions WHERE submitted_name <> 'Meine Bordsteinliege'
    OR name <> submitted_name OR description <> submitted_description) THEN
    RAISE EXCEPTION 'Player originals were not preserved in the initial draft';
  END IF;
END $$;
SELECT pg_temp.expect_error($q$UPDATE public.card_submissions SET status = 'approved'$q$, '42501');
SELECT pg_temp.expect_error($q$INSERT INTO public.cards (name) VALUES ('Bypass')$q$, '42501');
SELECT pg_temp.expect_error($q$SELECT public.claim_submission_ai(
  '92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001')$q$, '42501');
DO $$ BEGIN
  IF (SELECT count(*) FROM public.card_submissions) <> 2 THEN RAISE EXCEPTION 'Owner visibility/idempotency failed'; END IF;
  IF (SELECT count(*) FROM public.card_generation_settings) <> 0 THEN RAISE EXCEPTION 'Style settings leaked'; END IF;
END $$;
DO $$ BEGIN
  DELETE FROM storage.objects WHERE bucket_id = 'submission-images'
    AND name = '91000000-0000-0000-0000-000000000001/92000000-0000-0000-0000-000000000001.jpg';
EXCEPTION WHEN insufficient_privilege THEN
  -- Hosted Storage also blocks direct SQL deletion before evaluating row policies.
  IF SQLERRM NOT LIKE 'Direct deletion from storage tables is not allowed%' THEN RAISE; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'submission-images'
    AND name = '91000000-0000-0000-0000-000000000001/92000000-0000-0000-0000-000000000001.jpg') THEN
    RAISE EXCEPTION 'Submitted original was deletable';
  END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000002', TRUE);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.card_submissions) THEN RAISE EXCEPTION 'Cross-user read allowed'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'submission-images') THEN RAISE EXCEPTION 'Cross-user image read allowed'; END IF;
END $$;
SELECT pg_temp.expect_error($q$SELECT public.moderate_card_submission(
  '92000000-0000-0000-0000-000000000001', now(), 'approve', '{}')$q$, '42501');
RESET ROLE;

SET LOCAL ROLE service_role;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.claim_submission_ai('92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001')) <> 1 THEN
    RAISE EXCEPTION 'AI claim failed';
  END IF;
  IF EXISTS (SELECT 1 FROM public.claim_submission_ai('92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001')) THEN
    RAISE EXCEPTION 'Concurrent AI claim allowed';
  END IF;
END $$;
UPDATE public.card_submissions SET status = 'pending_review',
  ai_result = '{"reasoning":"Stärken mit Schwächen ausbalanciert"}',
  name = 'Bordsteinjuwel', description = 'Ein Fund mit ordentlich Straßenpatina.',
  final_stats = '{"witterung":70,"ambiente":60,"komfort":50,"format":40,"charakter":30}'
WHERE id = '92000000-0000-0000-0000-000000000001';
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000003', TRUE);
SELECT set_config('test.moderation_data', '{
  "name":"Laternen-Luxus","description":"Eine Legende zwischen Laterne und Bordstein.",
  "stats":{"witterung":85,"ambiente":75,"komfort":60,"format":50,"charakter":30},
  "rarity":"rare","notes":"Manuell geprüft"
}', TRUE);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.card_submissions) <> 2 THEN RAISE EXCEPTION 'Moderator cannot read queue'; END IF;
END $$;
DO $$ DECLARE changed BOOLEAN; BEGIN
  UPDATE public.card_generation_settings SET style_guide = 'Moderator darf den globalen Stil nicht ändern' RETURNING id INTO changed;
  IF FOUND THEN RAISE EXCEPTION 'Moderator changed admin-only settings'; END IF;
END $$;
-- Unreviewed cards cannot be approved, even by moderators.
SELECT pg_temp.expect_error($q$SELECT public.moderate_card_submission(
  '92000000-0000-0000-0000-000000000002',
  (SELECT updated_at FROM public.card_submissions WHERE id = '92000000-0000-0000-0000-000000000002'),
  'publish', current_setting('test.moderation_data')::JSONB)$q$);
-- Both excessive totals and multiple peak stats fail at the database boundary.
SELECT pg_temp.expect_error($q$SELECT public.moderate_card_submission(
  '92000000-0000-0000-0000-000000000001',
  (SELECT updated_at FROM public.card_submissions WHERE id = '92000000-0000-0000-0000-000000000001'),
  'publish', jsonb_set(current_setting('test.moderation_data')::JSONB, '{stats}',
    '{"witterung":100,"ambiente":100,"komfort":100,"format":100,"charakter":100}'))$q$);
SELECT pg_temp.expect_error($q$SELECT public.moderate_card_submission(
  '92000000-0000-0000-0000-000000000001',
  (SELECT updated_at FROM public.card_submissions WHERE id = '92000000-0000-0000-0000-000000000001'),
  'publish', jsonb_set(current_setting('test.moderation_data')::JSONB, '{stats}',
    '{"witterung":86,"ambiente":86,"komfort":0,"format":0,"charakter":0}'))$q$);
SELECT pg_temp.expect_error($q$SELECT public.moderate_card_submission(
  '92000000-0000-0000-0000-000000000001', now() - INTERVAL '1 day',
  'save', current_setting('test.moderation_data')::JSONB)$q$);
SELECT public.moderate_card_submission(
  '92000000-0000-0000-0000-000000000001',
  (SELECT updated_at FROM public.card_submissions WHERE id = '92000000-0000-0000-0000-000000000001'),
  'save', current_setting('test.moderation_data')::JSONB);
SELECT public.moderate_card_submission(
  '92000000-0000-0000-0000-000000000001',
  (SELECT updated_at FROM public.card_submissions WHERE id = '92000000-0000-0000-0000-000000000001'),
  'publish', current_setting('test.moderation_data')::JSONB);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.cards WHERE photographer_id = '91000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Card entered game before publication';
  END IF;
END $$;
RESET ROLE;
INSERT INTO storage.objects (bucket_id, name) VALUES ('card-images', 'approved/92000000-0000-0000-0000-000000000001.jpg');
SELECT set_config('test.moderation_data', (current_setting('test.moderation_data')::JSONB ||
  '{"image_url":"https://example.invalid/storage/v1/object/public/card-images/approved/92000000-0000-0000-0000-000000000001.jpg"}')::TEXT, TRUE);
SET LOCAL ROLE authenticated;
SELECT public.moderate_card_submission(
  '92000000-0000-0000-0000-000000000001',
  (SELECT updated_at FROM public.card_submissions WHERE id = '92000000-0000-0000-0000-000000000001'),
  'approve', current_setting('test.moderation_data')::JSONB);
-- Idempotent approval, including a stale timestamp.
SELECT public.moderate_card_submission('92000000-0000-0000-0000-000000000001', now() - INTERVAL '1 day', 'approve', '{}');
SELECT public.moderate_card_submission(
  '92000000-0000-0000-0000-000000000002',
  (SELECT updated_at FROM public.card_submissions WHERE id = '92000000-0000-0000-0000-000000000002'),
  'reject', '{"notes":"Kein geeigneter Fund"}');
RESET ROLE;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.card_submissions s JOIN public.cards c ON c.id = s.card_id
    WHERE s.id = '92000000-0000-0000-0000-000000000001'
      AND s.submitted_name = 'Meine Bordsteinliege'
      AND s.submitted_description = 'Sie wartet unter der Laterne auf den nächsten Umzug.'
      AND s.name = 'Laternen-Luxus' AND c.name = s.name
      AND c.stat_witterung = 85 AND c.stat_ambiente = 75 AND c.stat_komfort = 60
      AND c.stat_format = 50 AND c.stat_charakter = 30 AND NOT c.stats_need_review
  ) THEN RAISE EXCEPTION 'Published attributes or unchanged player originals are incorrect'; END IF;
  IF (SELECT count(*) FROM public.user_cards WHERE user_id = '91000000-0000-0000-0000-000000000001') <> 1
    OR (SELECT count(*) FROM public.cards WHERE photographer_id = '91000000-0000-0000-0000-000000000001') <> 1
    OR (SELECT cards_contributed FROM public.profiles WHERE id = '91000000-0000-0000-0000-000000000001') <> 1
    OR (SELECT cards_collected FROM public.profiles WHERE id = '91000000-0000-0000-0000-000000000001') <> 1
    OR (SELECT count(*) FROM public.notifications WHERE user_id = '91000000-0000-0000-0000-000000000001') <> 2
  THEN RAISE EXCEPTION 'Atomic approval/reward/rejection invariants failed'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000004', TRUE);
SET LOCAL ROLE authenticated;
UPDATE public.card_generation_settings SET style_guide = 'Trocken, absurd und liebevoll: Das Bordsteinjuwel schläft nie.' WHERE id = TRUE;
RESET ROLE;

ROLLBACK;
SELECT 'card_submissions_regression_passed' AS result;
