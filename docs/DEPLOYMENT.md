# NoTrace Deployment Guide

## Local Development

1. Copy `.env.example` to `.env`.
2. Replace all secrets with random 32-byte-or-longer values.
3. Install dependencies:
   ```powershell
   corepack pnpm install
   ```
4. Generate Prisma client:
   ```powershell
   corepack pnpm db:generate
   ```
5. Start PostgreSQL and Redis:
   ```powershell
   docker compose up -d postgres redis
   ```
6. Run migrations and seed data:
   ```powershell
   corepack pnpm db:migrate
   corepack pnpm db:seed
   ```
7. Start the apps:
   ```powershell
   corepack pnpm dev
   ```

Demo invite code from the seed script: `NOTRACE-DEMO`.

## Docker Compose

`docker-compose.yml` includes:

- `postgres`
- `redis`
- `api`
- `web`
- `nginx`

Run:

```powershell
docker compose up --build
```

The Nginx entrypoint is `http://localhost:8080`.

## Production VPS

1. Point DNS to the VPS.
2. Install Docker and Docker Compose.
3. Create `.env` with production values.
4. Use TLS termination through Nginx, Caddy, Traefik, or your cloud load balancer.
5. Set `APP_ORIGIN`, `API_PUBLIC_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SOCKET_URL` to HTTPS URLs.
6. Configure Cloudflare R2 or AWS S3 credentials.
7. Run:
   ```bash
   docker compose up -d --build
   docker compose exec api corepack pnpm prisma migrate deploy
   ```

## Storage

NoTrace expects S3-compatible storage. Cloudflare R2 is a good fit because egress pricing is friendly for media-heavy communities. Configure:

- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`

## Backups

- PostgreSQL: encrypted daily dumps plus point-in-time recovery when available.
- Object storage: lifecycle rules and versioning for abuse investigations.
- Redis: not required for long-term backups; it is realtime coordination state.

Do not restore backups into shared staging systems unless secrets and token hashes remain protected.
