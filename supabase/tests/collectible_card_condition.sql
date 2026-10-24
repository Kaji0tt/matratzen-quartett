BEGIN;

DO $$
DECLARE
  v_user UUID;
  v_card UUID;
  v_copy UUID;
  v_grade TEXT;
  v_modifiers JSONB;
  v_total INTEGER;
  v_count INTEGER;
BEGIN
  SELECT id INTO STRICT v_user FROM public.profiles LIMIT 1;
  SELECT id INTO STRICT v_card FROM public.cards LIMIT 1;

  INSERT INTO public.user_cards (user_id, card_id, acquisition_type)
  VALUES (v_user, v_card, 'achievement') RETURNING id, collectible_condition, stat_modifiers INTO v_copy, v_grade, v_modifiers;
  IF v_grade IS NULL OR v_grade IS DISTINCT FROM public.collectible_condition_for_modifier_total(
    (v_modifiers ->> 'witterung')::INTEGER + (v_modifiers ->> 'flecken')::INTEGER
    + (v_modifiers ->> 'ambiente')::INTEGER + (v_modifiers ->> 'komfort')::INTEGER
    + (v_modifiers ->> 'charakter')::INTEGER
  ) THEN RAISE EXCEPTION 'Non-editor copy condition must match its stat modifiers'; END IF;
  DELETE FROM public.user_cards WHERE id = v_copy;

  SELECT id, photographer_id INTO STRICT v_card, v_user FROM public.cards WHERE photographer_id IS NOT NULL LIMIT 1;
  INSERT INTO public.user_cards (user_id, card_id, acquisition_type, collectible_condition)
  VALUES (v_user, v_card, 'gift', 'poor') RETURNING id, collectible_condition, stat_modifiers INTO v_copy, v_grade, v_modifiers;
  IF v_grade IS DISTINCT FROM public.collectible_condition_for_modifier_total(
    (v_modifiers ->> 'witterung')::INTEGER + (v_modifiers ->> 'flecken')::INTEGER
    + (v_modifiers ->> 'ambiente')::INTEGER + (v_modifiers ->> 'komfort')::INTEGER
    + (v_modifiers ->> 'charakter')::INTEGER
  ) THEN RAISE EXCEPTION 'Creator condition must match its stat modifiers'; END IF;
  BEGIN
    UPDATE public.user_cards
    SET collectible_condition = CASE WHEN v_grade = 'poor' THEN 'mint' ELSE 'poor' END
    WHERE id = v_copy;
    RAISE EXCEPTION 'Creator condition modification was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  DELETE FROM public.user_cards WHERE id = v_copy;

  IF EXISTS (SELECT 1 FROM public.user_cards WHERE manual_entry_id IS NOT NULL AND (
    collectible_condition IS DISTINCT FROM 'editor'
    OR stat_modifiers IS DISTINCT FROM '{"witterung": 0, "flecken": 0, "ambiente": 0, "komfort": 0, "charakter": 0}'::JSONB
  )) THEN
    RAISE EXCEPTION 'Existing editor copies must have their own condition and zero modifiers';
  END IF;
  FOR v_copy IN SELECT id FROM public.user_cards WHERE manual_entry_id IS NOT NULL LOOP
    BEGIN
      UPDATE public.user_cards SET is_for_trade = TRUE WHERE id = v_copy;
      RAISE EXCEPTION 'Existing editor copy was allowed to be listed for trade';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
  END LOOP;

  SELECT entry.card_id INTO v_card FROM public.manual_card_entries AS entry
  WHERE NOT EXISTS (SELECT 1 FROM public.user_cards WHERE manual_entry_id = entry.card_id) LIMIT 1;
  IF v_card IS NOT NULL THEN
    INSERT INTO public.user_cards (user_id, card_id, acquisition_type, manual_entry_id)
    VALUES (v_user, v_card, 'gift', v_card) RETURNING id, collectible_condition, stat_modifiers INTO v_copy, v_grade, v_modifiers;
    IF v_grade IS DISTINCT FROM 'editor' OR v_modifiers IS DISTINCT FROM
      '{"witterung": 0, "flecken": 0, "ambiente": 0, "komfort": 0, "charakter": 0}'::JSONB THEN
      RAISE EXCEPTION 'New editor copy must use its own condition and preserve its defined values';
    END IF;
    BEGIN
      UPDATE public.user_cards SET is_for_trade = TRUE WHERE id = v_copy;
      RAISE EXCEPTION 'Editor copy was allowed to be listed for trade';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    DELETE FROM public.user_cards WHERE id = v_copy;
  END IF;

  SELECT id INTO STRICT v_card FROM public.cards LIMIT 1;
  FOR i IN 1..100 LOOP
    INSERT INTO public.user_cards (user_id, card_id, acquisition_type)
    VALUES (v_user, v_card, 'booster') RETURNING id, collectible_condition, stat_modifiers INTO v_copy, v_grade, v_modifiers;
    v_total := (v_modifiers ->> 'witterung')::INTEGER + (v_modifiers ->> 'flecken')::INTEGER
      + (v_modifiers ->> 'ambiente')::INTEGER + (v_modifiers ->> 'komfort')::INTEGER
      + (v_modifiers ->> 'charakter')::INTEGER;
    IF v_grade IS DISTINCT FROM public.collectible_condition_for_modifier_total(v_total)
      OR (v_modifiers ->> 'witterung')::INTEGER NOT BETWEEN -5 AND 5
      OR (v_modifiers ->> 'flecken')::INTEGER NOT BETWEEN -5 AND 5
      OR (v_modifiers ->> 'ambiente')::INTEGER NOT BETWEEN -5 AND 5
      OR (v_modifiers ->> 'komfort')::INTEGER NOT BETWEEN -5 AND 5
      OR (v_modifiers ->> 'charakter')::INTEGER NOT BETWEEN -5 AND 5 THEN
      RAISE EXCEPTION 'Booster copy must have a valid condition';
    END IF;
    UPDATE public.user_cards SET is_favorite = NOT is_favorite WHERE id = v_copy;
    SELECT count(*) INTO v_count FROM public.user_cards WHERE id = v_copy AND collectible_condition = v_grade;
    IF v_count <> 1 THEN RAISE EXCEPTION 'Preference update changed the condition'; END IF;
    BEGIN
      UPDATE public.user_cards SET collectible_condition = NULL WHERE id = v_copy;
      RAISE EXCEPTION 'Condition modification was accepted';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
      UPDATE public.user_cards
      SET stat_modifiers = jsonb_set(
        stat_modifiers, '{witterung}',
        to_jsonb(CASE WHEN (stat_modifiers ->> 'witterung')::INTEGER = 5
          THEN -5 ELSE (stat_modifiers ->> 'witterung')::INTEGER + 1 END)
      )
      WHERE id = v_copy;
      RAISE EXCEPTION 'Stat modifier change was accepted';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    DELETE FROM public.user_cards WHERE id = v_copy;
  END LOOP;
END;
$$;

ROLLBACK;
