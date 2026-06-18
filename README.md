# NoTrace

Secure, invite-only anonymous community chat with administrator approval, random pseudonyms, realtime messaging, disappearing messages, media uploads, reactions, replies, reports, and privacy-first defaults.

## Stack

- Frontend: Next.js 15, React, TypeScript, Tailwind CSS, shadcn-style UI primitives
- Backend: Node.js, Express, Socket.IO, JWT auth, refresh tokens
- Data: PostgreSQL, Prisma ORM
- Realtime scale-out: Redis-backed Socket.IO adapter
- Storage: S3-compatible API for Cloudflare R2, AWS S3, MinIO, or equivalent
- Deployment: Docker Compose and Caddy reverse proxy

## Quick Start

1. Copy `.env.example` to `.env` and replace all secrets.
2. Install dependencies with `pnpm install`.
3. Generate Prisma client with `pnpm db:generate`.
4. Run migrations with `pnpm db:migrate`.
5. Seed sample data with `pnpm db:seed`.
6. Start both apps with `pnpm dev`.

The web app runs on `http://localhost:3000`; the API and Socket.IO server run on `http://localhost:4000`.

For production deployment, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). For architecture, API, and security notes, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/API.md](docs/API.md), and [docs/SECURITY.md](docs/SECURITY.md).
