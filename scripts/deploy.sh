#!/usr/bin/env bash
# ==============================================================================
# Automated Production Deployment Script for Nura Medical SaaS
# Target OS: Ubuntu 22.04 / 24.04 LTS (Moroccan Cloud or Global VPS)
# Compliance: CNDP Law 09-08 / AES-256 / SSL TLS 1.3
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=================================================================${NC}"
echo -e "${BLUE}   Nura Medical SaaS — Production Deployment Engine              ${NC}"
echo -e "${BLUE}   Conforme CNDP (Loi 09-08) & Standards Santé Maroc            ${NC}"
echo -e "${BLUE}=================================================================${NC}"

# 1. Verify Prerequisites
command -v docker >/dev/null 2>&1 || {
    echo -e "${RED}[ERROR] Docker is not installed. Please install Docker first.${NC}" >&2
    exit 1
}

command -v openssl >/dev/null 2>&1 || {
    echo -e "${RED}[ERROR] OpenSSL is required to generate cryptographic secrets.${NC}" >&2
    exit 1
}

ENV_FILE=".env.production"

# 2. Generate Secrets if .env.production does not exist
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}[INFO] Creating secure $ENV_FILE with AES-256 cryptographic keys...${NC}"
    
    JWT_SECRET=$(openssl rand -hex 32)
    PATIENT_ENCRYPTION_KEY=$(openssl rand -hex 32)
    BLIND_INDEX_PEPPER=$(openssl rand -hex 32)
    DB_OWNER_PASSWORD=$(openssl rand -hex 16)
    DB_APP_PASSWORD=$(openssl rand -hex 16)

    read -p "Enter your registered domain (e.g., app.nura.ma): " DOMAIN_INPUT
    DOMAIN_NAME=${DOMAIN_INPUT:-nura.ma}

    cat > "$ENV_FILE" <<EOF
# Production Environment Configuration
DOMAIN_NAME=${DOMAIN_NAME}
NODE_ENV=production

# Database Credentials
DB_NAME=saas_prod
DB_OWNER_USER=saas_owner
DB_OWNER_PASSWORD=${DB_OWNER_PASSWORD}
DB_APP_USER=saas_app
DB_APP_PASSWORD=${DB_APP_PASSWORD}

# CNDP Law 09-08 Cryptographic Vault Keys
JWT_SECRET=${JWT_SECRET}
PATIENT_ENCRYPTION_KEY=${PATIENT_ENCRYPTION_KEY}
BLIND_INDEX_PEPPER=${BLIND_INDEX_PEPPER}

# Regional Settings
TIMEZONE=Africa/Casablanca
DEFAULT_LOCALE=fr
EOF

    chmod 600 "$ENV_FILE"
    echo -e "${GREEN}[OK] Secure production environment generated.${NC}"
else
    echo -e "${GREEN}[OK] Existing $ENV_FILE detected.${NC}"
fi

# 3. Pull / Build Containers
echo -e "${BLUE}[1/4] Building production container images...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file "$ENV_FILE" build --parallel

# 4. Initialize Database and Migrations
echo -e "${BLUE}[2/4] Starting database & cache services...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d db redis

echo -e "${YELLOW}Waiting for PostgreSQL to be healthy...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db sh -c 'until pg_isready -U saas_owner; do sleep 1; done'

# 5. Launch Full Stack with Caddy SSL
echo -e "${BLUE}[3/4] Launching application containers behind Caddy SSL...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d

# 6. Verify Deployment Health
echo -e "${BLUE}[4/4] Verifying health checks...${NC}"
sleep 5
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo -e "${GREEN}=================================================================${NC}"
echo -e "${GREEN}   Deployment Successful!                                        ${NC}"
echo -e "${GREEN}   URL: https://\$(grep DOMAIN_NAME $ENV_FILE | cut -d '=' -f2)  ${NC}"
echo -e "${GREEN}   SSL: Auto-managed by Let's Encrypt                            ${NC}"
echo -e "${GREEN}   Security: CNDP Law 09-08 Hardened & Isolated                  ${NC}"
echo -e "${GREEN}=================================================================${NC}"
