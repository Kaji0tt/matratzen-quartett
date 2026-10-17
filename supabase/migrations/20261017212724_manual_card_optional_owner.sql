-- Optional RPC parameters let typed clients omit an empty owner instead of casting null to UUID.
CREATE OR REPLACE FUNCTION public.save_manual_card(
  p_id UUID, p_expected_revision INTEGER, p_image_path TEXT,
  p_owner_id UUID DEFAULT NULL, p_data JSONB DEFAULT '{}'
)
RETURNS UUID LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.save_manual_card(p_id, p_expected_revision, p_image_path, p_owner_id, p_data); $$;
REVOKE ALL ON FUNCTION public.save_manual_card(UUID, INTEGER, TEXT, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_manual_card(UUID, INTEGER, TEXT, UUID, JSONB) TO authenticated;