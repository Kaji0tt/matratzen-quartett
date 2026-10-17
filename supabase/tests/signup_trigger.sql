-- These auth rows only exercise the trigger inside a rolled-back transaction.
BEGIN;

SELECT set_config('test.signup_probe_id', gen_random_uuid()::TEXT, true);
SELECT set_config('test.signup_fallback_id', gen_random_uuid()::TEXT, true);

SET LOCAL search_path = auth;

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  current_setting('test.signup_probe_id')::UUID,
  'mq_probe_' || current_setting('test.signup_probe_id') || '@example.invalid',
  jsonb_build_object(
    'username', 'mq_' || LEFT(current_setting('test.signup_probe_id'), 16),
    'avatar_url', 'https://example.invalid/avatar.png',
    'coins', 999999,
    'is_admin', true,
    'is_moderator', true
  )
);

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  current_setting('test.signup_fallback_id')::UUID,
  'mq_fallback_' || LEFT(current_setting('test.signup_fallback_id'), 8) || '@example.invalid',
  '{}'::JSONB
);

DO $$
DECLARE
  created_profile public.profiles%ROWTYPE;
  fallback_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO STRICT created_profile
  FROM public.profiles
  WHERE id = current_setting('test.signup_probe_id')::UUID;

  IF created_profile.username <> 'mq_' || LEFT(current_setting('test.signup_probe_id'), 16)
    OR created_profile.avatar_url IS DISTINCT FROM 'https://example.invalid/avatar.png'
    OR created_profile.coins <> 500
    OR created_profile.xp <> 0
    OR created_profile.is_admin
    OR created_profile.is_moderator
  THEN
    RAISE EXCEPTION 'Signup profile metadata or protected defaults are incorrect';
  END IF;

  SELECT * INTO STRICT fallback_profile
  FROM public.profiles
  WHERE id = current_setting('test.signup_fallback_id')::UUID;

  IF fallback_profile.username <> 'mq_fallback_' || LEFT(current_setting('test.signup_fallback_id'), 8)
    OR fallback_profile.avatar_url IS NOT NULL
    OR fallback_profile.coins <> 500
  THEN
    RAISE EXCEPTION 'Signup profile email fallback is incorrect';
  END IF;
END;
$$;

ROLLBACK;

SELECT 'signup_trigger_regression_passed' AS result;
