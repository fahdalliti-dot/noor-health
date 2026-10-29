-- Migration: Add SECURITY DEFINER function for session creation during login
-- This function runs as the table owner (saas_owner) which BYPASSES RLS,
-- allowing session creation during login when app.clinic_id is not yet set.

CREATE OR REPLACE FUNCTION create_session_for_login(
  p_user_id UUID,
  p_clinic_id UUID,
  p_family_id UUID,
  p_refresh_token_hash TEXT,
  p_device_label TEXT,
  p_ip INET,
  p_expires_at TIMESTAMPTZ
)
RETURNS "Session" AS $$
DECLARE
  v_session "Session";
BEGIN
  INSERT INTO "Session" (id, user_id, clinic_id, family_id, refresh_token_hash, device_label, ip, created_at, last_used_at, expires_at)
  VALUES (gen_random_uuid(), p_user_id, p_clinic_id, p_family_id, p_refresh_token_hash, p_device_label, p_ip, now(), now(), p_expires_at)
  RETURNING * INTO v_session;
  RETURN v_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to saas_app role
GRANT EXECUTE ON FUNCTION create_session_for_login(
  UUID, UUID, UUID, TEXT, TEXT, INET, TIMESTAMPTZ
) TO saas_app;