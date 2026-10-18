-- Run after all migrations. Test accounts, packs and purchases are rolled back.
BEGIN;
DO $$ BEGIN
  IF enum_range(NULL::public.rarity)::TEXT[] <> ARRAY['common','rare','epic','legendary'] THEN
    RAISE EXCEPTION 'Expected exactly four rarities';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='booster_packs' AND column_name='weight_uncommon') THEN
    RAISE EXCEPTION 'Legacy booster weight still exists';
  END IF;
  IF has_function_privilege('anon','public.open_booster(UUID, UUID)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.open_booster(UUID, UUID)','EXECUTE') THEN
    RAISE EXCEPTION 'Booster execute privileges changed';
  END IF;
  BEGIN
    PERFORM 'uncommon'::public.rarity;
    RAISE EXCEPTION 'Removed rarity is still accepted';
  EXCEPTION WHEN invalid_text_representation THEN NULL;
  END;
END $$;
INSERT INTO auth.users (id,email,raw_user_meta_data) VALUES
  ('9a000000-0000-0000-0000-000000000001','rarity_test@example.invalid','{"username":"mq_rarity_test"}');
INSERT INTO public.cards (name,description,image_url,photographer_id,rarity,is_approved)
SELECT 'Rarity test ' || value::TEXT,'Reserved regression test card','https://example.invalid/test.jpg',
  '9a000000-0000-0000-0000-000000000001',value,TRUE
FROM unnest(enum_range(NULL::public.rarity)) AS value;
INSERT INTO public.booster_packs (
  id,name,price_coins,card_count,weight_common,weight_rare,weight_epic,weight_legendary
) VALUES
  ('9a000000-0000-0000-0000-000000000002','Rarity test common',10,1,100,0,0,0),
  ('9a000000-0000-0000-0000-000000000003','Mega rarity test',10,1,999,1,0,0),
  ('9a000000-0000-0000-0000-000000000004','Legendary rarity test',10,1,999,999,1,0),
  ('9a000000-0000-0000-0000-000000000005','Rarity test highest',10,1,0,0,0,100);
-- New packs inherit the merged default, rather than a total of only 75.
INSERT INTO public.booster_packs (id,name) VALUES
  ('9a000000-0000-0000-0000-000000000006','Rarity default test');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.booster_packs
    WHERE id='9a000000-0000-0000-0000-000000000006'
      AND weight_common=85 AND weight_rare=10 AND weight_epic=4 AND weight_legendary=1) THEN
    RAISE EXCEPTION 'Default booster weights were not merged';
  END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','9a000000-0000-0000-0000-000000000001',TRUE);
SET LOCAL ROLE authenticated;
SELECT public.open_booster('9a000000-0000-0000-0000-000000000002','9b000000-0000-0000-0000-000000000002');
SELECT public.open_booster('9a000000-0000-0000-0000-000000000003','9b000000-0000-0000-0000-000000000003');
SELECT public.open_booster('9a000000-0000-0000-0000-000000000004','9b000000-0000-0000-0000-000000000004');
SELECT public.open_booster('9a000000-0000-0000-0000-000000000005','9b000000-0000-0000-0000-000000000005');
DO $$ DECLARE replay JSONB; BEGIN
  replay := public.open_booster('9a000000-0000-0000-0000-000000000002','9b000000-0000-0000-0000-000000000002');
  IF replay->>'replayed' <> 'true' THEN RAISE EXCEPTION 'Purchase was not idempotent'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.user_cards WHERE user_id='9a000000-0000-0000-0000-000000000001') <> 4
    OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id='9a000000-0000-0000-0000-000000000001'
      AND coins=460 AND boosters_opened=4 AND cards_collected=4)
    OR EXISTS (
      SELECT 1 FROM public.booster_openings b JOIN public.cards c ON c.id=b.cards_received[1]
      WHERE b.user_id='9a000000-0000-0000-0000-000000000001' AND c.rarity::TEXT <>
        CASE b.booster_pack_id
          WHEN '9a000000-0000-0000-0000-000000000002'::UUID THEN 'common'
          WHEN '9a000000-0000-0000-0000-000000000003'::UUID THEN 'rare'
          WHEN '9a000000-0000-0000-0000-000000000004'::UUID THEN 'epic'
          WHEN '9a000000-0000-0000-0000-000000000005'::UUID THEN 'legendary'
        END
    ) THEN RAISE EXCEPTION 'Rarity selection, guarantees or purchase counters are incorrect'; END IF;
END $$;
ROLLBACK;
SELECT 'rarity_regression_passed' AS result;
