-- All accounts, image metadata, cards and copies are rolled back.
BEGIN;
CREATE FUNCTION pg_temp.expect_error(p_sql TEXT, p_state TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE <> p_state THEN RAISE EXCEPTION 'Expected %, got %: %', p_state, SQLSTATE, SQLERRM; END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'Expected % for %', p_state, p_sql;
END;
$$;
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('94000000-0000-0000-0000-000000000001', 'mq_editor_owner@example.invalid', '{"username":"mq_editor_owner"}'),
  ('94000000-0000-0000-0000-000000000002', 'mq_editor_next@example.invalid', '{"username":"mq_editor_next"}'),
  ('94000000-0000-0000-0000-000000000003', 'mq_editor_mod@example.invalid', '{"username":"mq_editor_mod"}'),
  ('94000000-0000-0000-0000-000000000004', 'mq_editor_admin@example.invalid', '{"username":"mq_editor_admin"}'),
  ('94000000-0000-0000-0000-000000000005', 'mq_editor_banned@example.invalid', '{"username":"mq_editor_banned"}');
UPDATE public.profiles SET is_moderator = TRUE WHERE id = '94000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET is_admin = TRUE WHERE id = '94000000-0000-0000-0000-000000000004';
UPDATE public.profiles SET is_banned = TRUE, is_admin = TRUE WHERE id = '94000000-0000-0000-0000-000000000005';
INSERT INTO storage.objects (bucket_id, name)
VALUES ('manual-card-images', '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png');
SELECT set_config('test.manual_data', '{
  "name":"PNG-Patina","description":"Ein manuelles Bordsteinjuwel mit neonfarbener Patina.",
  "city":"Berlin","location":"Testviertel","country":"DE","condition":"fair","rarity":"rare","notes":"Manuell erstellt",
  "image_url":"https://example.invalid/storage/v1/object/public/manual-card-images/95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png",
  "stats":{"witterung":85,"ambiente":75,"komfort":60,"format":50,"charakter":30}
}', TRUE);
SELECT set_config('test.manual_save', $q$SELECT public.save_manual_card(
  '95000000-0000-0000-0000-000000000001', 0,
  '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png',
  NULL, current_setting('test.manual_data')::JSONB)$q$, TRUE);
SET LOCAL ROLE anon;
SELECT pg_temp.expect_error(current_setting('test.manual_save'), '42501');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000001', TRUE);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_error(current_setting('test.manual_save'), '42501');
SELECT pg_temp.expect_error($q$INSERT INTO storage.objects (bucket_id, name)
VALUES ('manual-card-images', '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000002.png')$q$, '42501');
SELECT pg_temp.expect_error($q$INSERT INTO public.manual_card_entries (card_id) VALUES (gen_random_uuid())$q$, '42501');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000005', TRUE);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_error(current_setting('test.manual_save'), '42501');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000003', TRUE);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_error($q$SELECT public.save_manual_card(
  '95000000-0000-0000-0000-000000000001',0,
  '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png',NULL,
  jsonb_set(current_setting('test.manual_data')::JSONB,'{stats,witterung}','86'))$q$, '22023');
SELECT public.save_manual_card(
  '95000000-0000-0000-0000-000000000001', 0,
  '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png',
  NULL, current_setting('test.manual_data')::JSONB);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cards WHERE id='95000000-0000-0000-0000-000000000001' AND is_approved) THEN
    RAISE EXCEPTION 'Manual card was not published';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cards WHERE id='95000000-0000-0000-0000-000000000001'
    AND stat_witterung=85 AND stat_ambiente=75 AND stat_komfort=60 AND stat_format=50
    AND stat_charakter=30 AND NOT stats_need_review) THEN
    RAISE EXCEPTION 'Manual editor did not publish the exact new attributes';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_cards WHERE manual_entry_id='95000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Empty owner granted a copy';
  END IF;
END $$;
-- Duplicate creation and stale saves must never grant extra copies.
SELECT pg_temp.expect_error(current_setting('test.manual_save'), '40001');
SELECT public.save_manual_card(
  '95000000-0000-0000-0000-000000000001',1,
  '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png',
  '94000000-0000-0000-0000-000000000001',current_setting('test.manual_data')::JSONB);
SELECT set_config('test.linked_copy', (SELECT id::TEXT FROM public.user_cards WHERE manual_entry_id='95000000-0000-0000-0000-000000000001'), TRUE);
-- Same owner and editing text preserve the exact linked copy.
SELECT public.save_manual_card(
  '95000000-0000-0000-0000-000000000001',2,
  '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png',
  '94000000-0000-0000-0000-000000000001',jsonb_set(current_setting('test.manual_data')::JSONB,'{name}','"PNG-Patina Edition 2"'));
RESET ROLE;
INSERT INTO public.user_cards (user_id, card_id, acquisition_type)
VALUES ('94000000-0000-0000-0000-000000000001','95000000-0000-0000-0000-000000000001','booster');
UPDATE public.profiles SET cards_collected=cards_collected+1 WHERE id='94000000-0000-0000-0000-000000000001';
-- A different ordinary copy must remain tradeable.
UPDATE public.user_cards SET is_for_trade=TRUE, trade_price=100
WHERE card_id='95000000-0000-0000-0000-000000000001' AND manual_entry_id IS NULL;
SELECT set_config('request.jwt.claim.sub','94000000-0000-0000-0000-000000000001',TRUE);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.manual_card_entries) THEN RAISE EXCEPTION 'Regular player read editor metadata'; END IF;
END $$;
SELECT pg_temp.expect_error($q$UPDATE public.user_cards SET manual_entry_id=NULL
WHERE id=current_setting('test.linked_copy')::UUID$q$, '42501');
SELECT pg_temp.expect_error($q$UPDATE public.user_cards SET is_for_trade=TRUE
WHERE id=current_setting('test.linked_copy')::UUID$q$, '23514');
UPDATE public.user_cards SET is_favorite=TRUE WHERE id=current_setting('test.linked_copy')::UUID;
RESET ROLE;
INSERT INTO public.trade_offers (id, sender_id, receiver_id)
VALUES ('97000000-0000-0000-0000-000000000001','94000000-0000-0000-0000-000000000001','94000000-0000-0000-0000-000000000002');
SELECT pg_temp.expect_error($q$INSERT INTO public.trade_offer_cards (trade_offer_id,user_card_id,side)
VALUES ('97000000-0000-0000-0000-000000000001',current_setting('test.linked_copy')::UUID,'offered')$q$, '42501');
SELECT set_config('request.jwt.claim.sub','94000000-0000-0000-0000-000000000004',TRUE);
SET LOCAL ROLE authenticated;
SELECT public.save_manual_card(
  '95000000-0000-0000-0000-000000000001',3,
  '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png',
  '94000000-0000-0000-0000-000000000002',current_setting('test.manual_data')::JSONB);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_cards WHERE id=current_setting('test.linked_copy')::UUID
    AND user_id='94000000-0000-0000-0000-000000000002' AND NOT is_favorite) THEN
    RAISE EXCEPTION 'Linked copy did not transfer cleanly';
  END IF;
END $$;
-- Invalid owner must roll back the entire card edit.
SELECT pg_temp.expect_error($q$SELECT public.save_manual_card(
  '95000000-0000-0000-0000-000000000001',4,
  '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png',
  '94000000-0000-0000-0000-000000000005',jsonb_set(current_setting('test.manual_data')::JSONB,'{name}','"Should not persist"'))$q$, '22023');
SELECT pg_temp.expect_error($q$SELECT public.save_manual_card(
  '95000000-0000-0000-0000-000000000001',3,
  '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png',
  NULL,current_setting('test.manual_data')::JSONB)$q$, '40001');
RESET ROLE;
DO $$ BEGIN
  IF (SELECT cards_collected FROM public.profiles WHERE id='94000000-0000-0000-0000-000000000001') <> 1
    OR (SELECT cards_collected FROM public.profiles WHERE id='94000000-0000-0000-0000-000000000002') <> 1
    OR (SELECT count(*) FROM public.user_cards WHERE card_id='95000000-0000-0000-0000-000000000001') <> 2
    OR (SELECT name FROM public.cards WHERE id='95000000-0000-0000-0000-000000000001') <> 'PNG-Patina' THEN
    RAISE EXCEPTION 'Transfer changed another copy, counters, or failed edit persisted';
  END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT public.save_manual_card(
  p_id => '95000000-0000-0000-0000-000000000001', p_expected_revision => 4,
  p_image_path => '95000000-0000-0000-0000-000000000001/96000000-0000-0000-0000-000000000001.png',
  p_data => current_setting('test.manual_data')::JSONB);
RESET ROLE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.user_cards WHERE manual_entry_id='95000000-0000-0000-0000-000000000001')
    OR (SELECT count(*) FROM public.user_cards WHERE card_id='95000000-0000-0000-0000-000000000001') <> 1
    OR (SELECT cards_collected FROM public.profiles WHERE id='94000000-0000-0000-0000-000000000002') <> 0
    OR (SELECT count(*) FROM public.notifications WHERE user_id IN (
      '94000000-0000-0000-0000-000000000001','94000000-0000-0000-0000-000000000002')) <> 4 THEN
    RAISE EXCEPTION 'Removing owner did not remove only the linked copy';
  END IF;
END $$;
ROLLBACK;
SELECT 'manual_card_editor_regression_passed' AS result;
