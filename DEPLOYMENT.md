# Guide de Déploiement & Exploitation en Production (SaaS Médical Maroc)

Ce guide décrit la mise en production du SaaS Médical multi-tenant pour cabinets et cliniques au Maroc, conformément aux exigences techniques et réglementaires de la **CNDP (Loi N° 09-08)**.

---

## 1. Architecture des Services

Le système est conteneurisé et orchestré via Docker Compose :

| Conteneur | Image / Base | Rôle & Ports |
|---|---|---|
| `saas-web` | Node 20 Alpine (Next.js 14) | Cockpit clinique web (Port `3000`) |
| `saas-api` | Node 20 Alpine (NestJS 10) | API métier & passerelles (Port `4000`) |
| `saas-db` | PostgreSQL 16 Alpine | Base multi-tenant avec RLS & `btree_gist` (Port `5432`) |
| `saas-redis` | Redis 7 Alpine | Caching de sessions & rate-limiting (Port `6379`) |
| `saas-mailpit` | Mailpit | Serveur SMTP de simulation (Ports `1025` SMTP / `8025` Web) |

---

## 2. Variables d'Environnement Obligatoires (`.env`)

Générer des clés cryptographiques distinctes pour la production avec OpenSSL :

```bash
# 1. Clé de chiffrement AES-256-GCM des CINs (64 caractères hex)
openssl rand -hex 32

# 2. Pepper HMAC-SHA256 pour blind index des CINs (64 caractères hex)
openssl rand -hex 32

# 3. Secret JWT
openssl rand -base64 48
```

Exemple de fichier `.env` de production :

```ini
# Base de données
DATABASE_URL="postgresql://saas_owner:VOTRE_MOT_DE_PASSE_SECURISE@localhost:5432/saas_dev?schema=public"
APP_DATABASE_URL="postgresql://saas_app:VOTRE_MOT_DE_PASSE_SECURISE@localhost:5432/saas_dev?schema=public"

# Cryptographie CNDP (Loi 09-08)
PATIENT_ENCRYPTION_KEY="<clé-32-octets-hex>"
BLIND_INDEX_PEPPER="<pepper-32-octets-hex>"

# Hachage mots de passe (Argon2id conforme CNDP)
ARGON2ID_MEMORY=65536
ARGON2ID_PARALLELISM=4
ARGON2ID_TIMEOUT=30000

# Jetons de session
JWT_SECRET="<secret-fort>"
JWT_ACCESS_TOKEN_TTL=900      # 15 minutes
JWT_REFRESH_TOKEN_TTL=43200   # 12 heures

# Serveurs
NEXT_PUBLIC_APP_URL="https://app.cabinet-medical.ma"
NEXT_PUBLIC_API_URL="https://api.cabinet-medical.ma"
NEXT_PUBLIC_DEFAULT_LOCALE="fr"
```

---

## 3. Déploiement Automatisé en 1 Commande (Production)

Pour déployer sur un serveur Ubuntu 22.04 / 24.04 LTS (Hébergement Cloud au Maroc ou VPS) :

```bash
# 1. Rendre les scripts exécutables
chmod +x scripts/deploy.sh scripts/backup-cndp.sh

# 2. Lancer le déploiement automatisé
./scripts/deploy.sh
```

Ce script effectue automatiquement :
- La génération des clés cryptographiques AES-256 et des mots de passe dans `.env.production`
- La construction multi-stage optimisée des conteneurs
- L'initialisation de PostgreSQL avec extensions cryptographiques (`pgcrypto`, `uuid-ossp`, `btree_gist`)
- Le démarrage du reverse proxy **Caddy** avec obtention et renouvellement automatique des certificats SSL Let's Encrypt / ZeroSSL
- L'isolation réseau (les bases de données et services internes ne sont pas exposés à Internet)

---

## 4. Reverse Proxy Caddy & SSL Automatique (`docker-compose.prod.yml`)

En production, seul le port `443` (HTTPS) et `80` (redirection HTTP vers HTTPS) sont exposés au public.

```bash
# Démarrer manuellement en mode production
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## 5. Sauvegardes Chiffrées Conformes CNDP (`scripts/backup-cndp.sh`)

La Loi 09-08 impose le chiffrement au repos des sauvegardes contenant des données de santé :

```bash
# Configuration de la tâche Cron quotidienne (chaque nuit à 02:00 heure de Casablanca)
0 2 * * * BACKUP_PASSPHRASE="votre-cle-de-chiffrement" /opt/saas/scripts/backup-cndp.sh >> /var/log/nura-backup.log 2>&1
```

---

## 6. Politique de Sécurité & Conformité Réglementaire Marocaine

1. **Isolation Multi-Clinique (PostgreSQL RLS) :**
   - L'API s'exécute sous le rôle restreint `saas_app` avec le flag `NOBYPASSRLS`.
   - Chaque transaction SQL définit `SET LOCAL app.clinic_id = '...'` empêchant tout croisement de données entre cliniques.
2. **Chiffrement des Données Sensibles :**
   - Les numéros de CIN marocains sont chiffrés en **AES-256-GCM** au repos.
   - Les recherches exactes par CIN s'effectuent via un **blind index HMAC-SHA256**.
3. **Traçabilité & Registre CNDP :**
   - La table `AuditLog` enregistre les accès et modifications cliniques avec horodatage Casablanca, opérateur, et empreinte cryptographique.
   - Durée de conservation légale des dossiers médicaux : **10 ans** au Maroc.
