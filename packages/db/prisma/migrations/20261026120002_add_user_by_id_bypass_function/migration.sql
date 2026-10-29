-- Migration: Add SECURITY DEFINER function for user lookup by ID during auth verification
-- User.id in Prisma is TEXT.

CREATE OR REPLACE FUNCTION find_user_by_id_for_auth(p_id TEXT)
RETURNS SETOF "User" AS $$
BEGIN
  RETURN QUERY SELECT * FROM "User" WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to saas_app role
GRANT EXECUTE ON FUNCTION find_user_by_id_for_auth(TEXT) TO saas_app;
