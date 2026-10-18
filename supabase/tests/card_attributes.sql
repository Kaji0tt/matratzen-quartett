-- Run after all migrations. Test rows and drafts are rolled back.
BEGIN;
CREATE FUNCTION pg_temp.expect_error(p_sql TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN RETURN;
  END;
  RAISE EXCEPTION 'Expected rejection for %', p_sql;
END;
$$;
DO $$ BEGIN
  IF NOT private.valid_submission_stats('{"witterung":0,"flecken":50,"ambiente":100,"komfort":50,"charakter":50}')
    OR private.valid_submission_stats('{"witterung":0,"ambiente":100,"komfort":50,"format":50,"charakter":50}')
    OR private.valid_submission_stats('{"alter":50,"flecken":50,"witterung":50,"geruch":50,"kontaminierung":50}')
    OR private.valid_submission_stats('{"witterung":0,"flecken":50,"ambiente":100,"komfort":50,"charakter":50,"extra":1}')
    OR private.valid_submission_stats('{"witterung":0,"flecken":50,"ambiente":100,"komfort":50,"charakter":1.5}')
    OR private.valid_submission_stats('{"witterung":0,"flecken":50,"ambiente":100,"komfort":50,"charakter":101}')
    OR private.valid_submission_stats('{"witterung":0,"flecken":50,"ambiente":100,"komfort":50,"charakter":"50"}') THEN
    RAISE EXCEPTION 'Stat validator accepted wrong keys or values';
  END IF;
END $$;
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('99000000-0000-0000-0000-000000000001', 'attribute_test@example.invalid', '{"username":"attribute_test"}');
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('submission-images', '99000000-0000-0000-0000-000000000001/99000000-0000-0000-0000-000000000002.jpg');
SELECT set_config('test.attribute_data', jsonb_build_object(
  'captured_at', now(), 'city', 'Berlin', 'location', 'Testviertel', 'country', 'DE',
  'found_on', CURRENT_DATE, 'condition', 'good', 'observations', 'Gepolstert mit Blumenmuster',
  'surroundings', 'Zwischen zwei Stuehlen', 'name', 'Dit is meine Liege',
  'description', 'Dit is meine Matratze, wa.',
  'proposed_stats', '{"witterung":10,"flecken":50,"ambiente":90,"komfort":70,"charakter":60}'::JSONB
)::TEXT, TRUE);
SELECT set_config('request.jwt.claim.sub', '99000000-0000-0000-0000-000000000001', TRUE);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_error($q$SELECT public.create_card_submission(
  '99000000-0000-0000-0000-000000000002', current_setting('test.attribute_data')::JSONB - 'name')$q$);
SELECT pg_temp.expect_error($q$SELECT public.create_card_submission(
  '99000000-0000-0000-0000-000000000002', current_setting('test.attribute_data')::JSONB - 'description')$q$);
SELECT pg_temp.expect_error($q$SELECT public.create_card_submission(
  '99000000-0000-0000-0000-000000000002',
  jsonb_set(current_setting('test.attribute_data')::JSONB, '{description}', '"kurz"'))$q$);
SELECT pg_temp.expect_error($q$SELECT public.create_card_submission(
  '99000000-0000-0000-0000-000000000002',
  jsonb_set(current_setting('test.attribute_data')::JSONB, '{proposed_stats}',
    '{"alter":50,"flecken":50,"witterung":50,"geruch":50,"kontaminierung":50}'))$q$);
SELECT public.create_card_submission(
  '99000000-0000-0000-0000-000000000002', current_setting('test.attribute_data')::JSONB);
RESET ROLE;
-- Simulate storing a correction proposal: the draft and the player originals stay separate.
UPDATE public.card_submissions SET status = 'pending_review',
  ai_result = '{"name":"Korrigierter Name","description":"Korrekturvorschlag","text_review":{"needs_review":true,"reasoning":"Stilabweichung bitte manuell pruefen"}}',
  final_stats = proposed_stats
WHERE id = '99000000-0000-0000-0000-000000000002';
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.card_submissions WHERE id = '99000000-0000-0000-0000-000000000002'
      AND submitted_name = 'Dit is meine Liege' AND name = submitted_name
      AND submitted_description = 'Dit is meine Matratze, wa.' AND description = submitted_description
      AND ai_result->'text_review'->>'needs_review' = 'true'
      AND NOT stats_need_review
  ) THEN RAISE EXCEPTION 'Player originals, draft or assessment lost'; END IF;
END $$;
ROLLBACK;
