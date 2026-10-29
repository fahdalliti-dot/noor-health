#!/usr/bin/env bash
# ==============================================================================
# CNDP-Compliant Daily Encrypted Database Backup
# Regulated under Moroccan Law 09-08 on Health Data Protection
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/var/backups/nura-medical"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30
CONTAINER_NAME="saas-db"
DB_NAME="saas_prod"
DB_USER="saas_owner"

mkdir -p "$BACKUP_DIR"

echo "[$(date -u)] Starting CNDP database backup..."

# 1. Dump database from Postgres container
DUMP_FILE="${BACKUP_DIR}/dump_${DB_NAME}_${TIMESTAMP}.sql.gz"
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$DUMP_FILE"

# 2. Encrypt with AES-256 (CNDP requirement: health data backups must be encrypted at rest)
if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
    openssl enc -aes-256-cbc -salt -pbkdf2 -in "$DUMP_FILE" -out "${DUMP_FILE}.enc" -pass pass:"$BACKUP_PASSPHRASE"
    rm -f "$DUMP_FILE"
    echo "[$(date -u)] Encrypted backup created: ${DUMP_FILE}.enc"
else
    echo "[$(date -u)] Plain compressed backup created: ${DUMP_FILE} (Set BACKUP_PASSPHRASE for rest encryption)"
fi

# 3. Clean up backups older than retention policy (30 days)
find "$BACKUP_DIR" -type f -name "dump_*" -mtime "+$RETENTION_DAYS" -delete
echo "[$(date -u)] Retention cleanup completed. Retained last $RETENTION_DAYS days."
