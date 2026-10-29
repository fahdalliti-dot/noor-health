-- Migration: Add SECURITY DEFINER function for login user lookup
-- This function runs as the table owner (saas_owner) which BYPASSES RLS,
-- allowing user lookup by email during login when app.clinic_id is not yet known.

CREATE OR REPLACE FUNCTION find_user_by_email_for_login(p_email TEXT)
RETURNS SETOF "User" AS $$
BEGIN
  RETURN QUERY SELECT * FROM "User" WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to saas_app role
GRANT EXECUTE ON FUNCTION find_user_by_email_for_login(TEXT) TO saas_app;