# HOW-TO: Project 7 Crypto Bot (End-to-End Guide)

This guide explains what each part does and gives exact copy/paste commands to run the project locally. It’s written for a high‑school level: short definitions first, then step‑by‑step commands.

Definitions (plain English)
- Docker Compose: A simple way to run multiple apps together (database, API, etc.) using one YAML file. One command starts/stops all the pieces.
- Backend API: The Node.js/TypeScript server that exposes HTTP endpoints like `/health`, `/auth`, `/strategies`.
- Postgres: The SQL database where your data lives.
- Redis: A fast in‑memory store used for queues and caching.
- Quant service: The Python part for strategy/backtest work.
- Prometheus/Grafana: Monitoring tools. Prometheus collects metrics; Grafana shows charts.

Paths you will use
- Repo root (Windows path): `/mnt/c/Users/Cristian/Desktop/Project 7 Main/Project7_CryptoBot_Dev`
- Backend (repo): `/mnt/c/Users/Cristian/Desktop/Project 7 Main/Project7_CryptoBot_Dev/apps/backend`
- Backend (WSL fast dev mirror on Linux filesystem): `~/project7-backend`
- JWT keys directory: `~/p7-secrets`

Important notes about WSL and ports
- Installs and dev servers run faster and more reliably on the WSL Linux filesystem (your home folder) than on the Windows mount (`/mnt/c`).
- To avoid port conflicts, use port 8081 for backend dev; Docker Compose uses 8080.

Prerequisites (run once in WSL Ubuntu)
1) Install Postgres client (for `psql` checks)
```
sudo apt-get update
sudo apt-get install -y postgresql-client
```
2) Ensure Docker Desktop is installed on Windows and WSL integration is enabled for your Ubuntu distro.
3) Node.js 20+ is already present in this environment (verify with `node -v`).

Step 1 — Generate JWT Keys (for login tokens)
Why: The backend signs/verifies tokens; Ed25519 keys are small and secure.
Commands (copy/paste):
```
mkdir -p ~/p7-secrets && cd ~/p7-secrets
openssl genpkey -algorithm ed25519 -out jwt_private.pem
openssl pkey -in jwt_private.pem -pubout -out jwt_public.pem
ls -l ~/p7-secrets/jwt_*.pem
```

Step 2 — Start Postgres/Redis with Docker Compose
Why: The backend depends on Postgres and Redis.
Commands (run from the repo folder that contains docker-compose.yml):
```
cd "/mnt/c/Users/Cristian/Desktop/Project 7 Main/Project7_CryptoBot_Dev"
ls -l docker-compose.yml
docker compose up -d postgres redis
```

Step 3 — Wait for Postgres, Migrate, and Seed
Why: Create tables and insert demo data.
Commands:
```
export PGPASSWORD=postgres
until psql -h 127.0.0.1 -U postgres -d crypto_saas -c "select 1" >/dev/null 2>&1; do echo waiting for postgres...; sleep 1; done
psql -h 127.0.0.1 -U postgres -d crypto_saas -v ON_ERROR_STOP=1 -f db/migrations/0001_init.sql
psql -h 127.0.0.1 -U postgres -d crypto_saas -v ON_ERROR_STOP=1 -f db/seed.sql
psql -h 127.0.0.1 -U postgres -d crypto_saas -c "select * from app.users;"
```
What you should see: one demo user row with email `demo@local`.

Option A — Fast Backend Dev on WSL (recommended while editing code)
Why: Avoids Windows mount file‑locking issues and is much faster.
1) Mirror backend into WSL home (excludes heavy folders)
```
rsync -a --exclude 'node_modules' --exclude 'dist' \
  "/mnt/c/Users/Cristian/Desktop/Project 7 Main/Project7_CryptoBot_Dev/apps/backend/" \
  ~/project7-backend/
```
2) Install dependencies (with a peer‑deps workaround already set in package.json)
```
cd ~/project7-backend
npm install --no-audit --no-fund --legacy-peer-deps
```
3) Create backend `.env` (uses 8081)
```
cat > ~/project7-backend/.env <<'EOF'
PORT=8081
JWT_ISSUER=project7.local
JWT_AUDIENCE=project7.clients
JWT_PRIVATE_KEY_PATH=/home/$USER/p7-secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/home/$USER/p7-secrets/jwt_public.pem
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgres://postgres:postgres@localhost:5432/crypto_saas
EOF
```
4) Run the dev server (force Linux tmp to prevent WSL pipe issues)
```
cd ~/project7-backend
unset JWT_PRIVATE_KEY JWT_PUBLIC_KEY
TMPDIR=/tmp npm run dev
```
5) Check health
```
curl -s http://localhost:8081/health
```

Option B — Backend in Docker (if you prefer everything in Compose)
1) Build and run backend + quant (from repo root)
```
cd "/mnt/c/Users/Cristian/Desktop/Project 7 Main/Project7_CryptoBot_Dev"
docker compose up -d --build backend quant
```
2) Health checks
```
curl -s http://localhost:8080/health    # backend via Compose
curl -s http://localhost:8001/health    # quant service
```

Monitoring (optional)
```
cd "/mnt/c/Users/Cristian/Desktop/Project 7 Main/Project7_CryptoBot_Dev"
docker compose up -d prometheus grafana
```
Open:
- Prometheus: http://localhost:9090
- Grafana:    http://localhost:3001

Frontend (only if `apps/frontend` exists)
Why: Runs the web UI on port 3000 and talks to the backend.
```
cd "/mnt/c/Users/Cristian/Desktop/Project 7 Main/Project7_CryptoBot_Dev"
if [ -d apps/frontend ]; then 
  cd apps/frontend
  printf "NEXT_PUBLIC_API_BASE=http://localhost:8081\nNEXT_PUBLIC_TENANT_ID=00000000-0000-0000-0000-000000000001\n" > .env.local
  npm i
  npm run dev
  # visit http://localhost:3000
else
  echo "apps/frontend not found; skipping UI."
fi
```

Daily Workflow (short version)
```
# Start DBs once per session
cd "/mnt/c/Users/Cristian/Desktop/Project 7 Main/Project7_CryptoBot_Dev"
docker compose up -d postgres redis

# Backend dev on WSL ext4
cd ~/project7-backend
TMPDIR=/tmp PORT=8081 npm run dev
```

Troubleshooting (common errors and fixes)
- Port already in use (EADDRINUSE):
  - Find: `ss -ltnp | grep ':8080\|:8081' || true`
  - Stop dev: `pkill -f "tsx src/index.ts" || pkill -f "node dist/index.js" || true`
  - Or run on 8081: `PORT=8081 TMPDIR=/tmp npm run dev`
- tsx ENOTSUP pipe error on WSL:
  - Always run with `TMPDIR=/tmp npm run dev` (keeps temp files on Linux filesystem).
- npm EACCES / stalls on `/mnt/c`:
  - Use the WSL mirror (`~/project7-backend`) and install there.
- "no configuration file provided" from docker compose:
  - You ran compose outside the folder with `docker-compose.yml`. `cd` to the repo root or use `-f <path>`.
- Postgres not ready:
  - Wait loop: `until psql -h 127.0.0.1 -U postgres -d crypto_saas -c "select 1" >/dev/null 2>&1; do echo waiting...; sleep 1; done`
- JWT key errors (Invalid private key):
  - Prefer `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` in `.env`. If you previously exported inline envs, run `unset JWT_PRIVATE_KEY JWT_PUBLIC_KEY`.

Clean Up (Docker)
```
cd "/mnt/c/Users/Cristian/Desktop/Project 7 Main/Project7_CryptoBot_Dev"
docker compose down
# Optional space reclaim
docker image prune -f
docker volume prune -f
```

Glossary
- Service: One running component (e.g., postgres) managed by Docker Compose.
- Port mapping: Exposes a service port on your computer (e.g., `8080:8080` means container 8080 is reachable at localhost:8080).
- Migration: A script that creates/changes database tables.
- Seed: Sample data to help you start quickly.

That’s it! If you get stuck, compare your current folder (`pwd`) with the paths in this guide, and re‑run the exact copy/paste commands for the step you’re on.

