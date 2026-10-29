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

## 3. Démarrage Rapide via Docker Compose

### Étape 1 : Lancement de l'infrastructure
```bash
docker compose up -d db redis mailpit
```

### Étape 2 : Application des migrations Prisma & Seed
```bash
# Déploiement des tables et politiques RLS
pnpm db:migrate

# Injection du jeu de données cliniques marocaines
pnpm db:seed
```

### Étape 3 : Démarrage des applications
```bash
docker compose up -d --build
```

---

## 4. Politique de Sécurité & Conformité Réglementaire Marocaine

1. **Isolation Multi-Clinique (PostgreSQL RLS) :**
   - L'API s'exécute sous le rôle restreint `saas_app` avec le flag `NOBYPASSRLS`.
   - Chaque transaction SQL définit `SET LOCAL app.clinic_id = '...'` empêchant tout croisement de données entre cliniques.
2. **Chiffrement des Données Sensibles :**
   - Les numéros de CIN marocains sont chiffrés en **AES-256-GCM** au repos.
   - Les recherches exactes par CIN s'effectuent via un **blind index HMAC-SHA256**.
3. **Traçabilité & Registre CNDP :**
   - La table `AuditLog` enregistre les accès et modifications cliniques avec horodatage Casablanca, opérateur, et empreinte cryptographique.
   - Durée de conservation légale des dossiers médicaux : **10 ans** au Maroc.
