-- Idempotent PostgreSQL setup for SaaS for Doctors in Morocco
-- Run as superuser (postgres): psql -U postgres -f scripts/db-setup.sql
-- Creates roles, extensions, and databases

-- ============================================
-- EXTENSIONS (in template1 so all DBs inherit)
-- ============================================
\c template1
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================
-- ROLES
-- ============================================
-- saas_owner: owns schema, runs migrations, creates databases
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'saas_owner') THEN
    CREATE ROLE saas_owner WITH
      LOGIN
      NOSUPERUSER
      NOBYPASSRLS
      CREATEDB
      NOCREATEROLE
      NOREPLICATION
      PASSWORD 'saas_pass';
  ELSE
    ALTER ROLE saas_owner WITH
      NOSUPERUSER
      NOBYPASSRLS
      CREATEDB
      PASSWORD 'saas_pass';
  END IF;
END
$$;

-- saas_app: API application role, restricted
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'saas_app') THEN
    CREATE ROLE saas_app WITH
      LOGIN
      NOSUPERUSER
      NOBYPASSRLS
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      PASSWORD 'saas_pass';
  ELSE
    ALTER ROLE saas_app WITH
      NOSUPERUSER
      NOBYPASSRLS
      NOCREATEDB
      PASSWORD 'saas_pass';
  END IF;
END
$$;

-- ============================================
-- DATABASES
-- ============================================
-- Development database
SELECT 'CREATE DATABASE saas_dev OWNER saas_owner'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'saas_dev')\gexec

-- Test database
SELECT 'CREATE DATABASE saas_test OWNER saas_owner'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'saas_test')\gexec

-- ============================================
-- GRANTS ON DATABASES
-- ============================================
\c saas_dev
GRANT CONNECT ON DATABASE saas_dev TO saas_app;
GRANT USAGE ON SCHEMA public TO saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO saas_app;

\c saas_test
GRANT CONNECT ON DATABASE saas_test TO saas_app;
GRANT USAGE ON SCHEMA public TO saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO saas_app;

-- ============================================
-- VERIFY
-- ============================================
\c saas_dev
SELECT 'Extensions:' as step;
\dx btree_gist pg_trgm citext

SELECT 'Roles:' as step;
\du saas_owner saas_app

SELECT 'Databases:' as step;
\l saas_dev saas_test

SELECT 'Grants on saas_dev:' as step;
\dp

SELECT 'Setup complete!' as status;