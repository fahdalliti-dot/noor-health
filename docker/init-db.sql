-- ====================================================================
-- Moroccan Medical SaaS — PostgreSQL Initialization Script
-- Configures multi-tenant databases, roles, and RLS isolation
-- ====================================================================

-- 1. Ensure databases exist
CREATE DATABASE saas_dev;
CREATE DATABASE saas_test;

-- 2. Create owner role (used for migrations and schema definitions)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'saas_owner') THEN
    CREATE ROLE saas_owner WITH LOGIN PASSWORD 'saas_pass' SUPERUSER CREATEDB;
  END IF;
END
$$;

-- 3. Create restricted app role (used by NestJS API at runtime)
-- NOBYPASSRLS ensures RLS policies cannot be bypassed even by mistake
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'saas_app') THEN
    CREATE ROLE saas_app WITH LOGIN PASSWORD 'saas_pass' NOSUPERUSER NOCREATEDB NOBYPASSRLS;
  END IF;
END
$$;

-- 4. Connect to saas_dev and enable extensions & grants
\c saas_dev;

CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

GRANT ALL PRIVILEGES ON DATABASE saas_dev TO saas_owner;
GRANT CONNECT ON DATABASE saas_dev TO saas_app;
GRANT USAGE ON SCHEMA public TO saas_app;

ALTER DEFAULT PRIVILEGES FOR ROLE saas_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO saas_app;

ALTER DEFAULT PRIVILEGES FOR ROLE saas_owner IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO saas_app;

-- 5. Connect to saas_test and enable extensions & grants
\c saas_test;

CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

GRANT ALL PRIVILEGES ON DATABASE saas_test TO saas_owner;
GRANT CONNECT ON DATABASE saas_test TO saas_app;
GRANT USAGE ON SCHEMA public TO saas_app;

ALTER DEFAULT PRIVILEGES FOR ROLE saas_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO saas_app;

ALTER DEFAULT PRIVILEGES FOR ROLE saas_owner IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO saas_app;
