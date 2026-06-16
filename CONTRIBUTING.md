# Contributing to NoTrace

First off, thank you for considering contributing to NoTrace!

This document provides guidelines and instructions for developers working on the NoTrace repository.

## 1. Project Setup

This project uses a monorepo structure managed by `pnpm`.

### Prerequisites
- Node.js (v20+)
- `pnpm` (v9+)
- PostgreSQL (v15+)
- Redis (v7+)

### Installation
1. Clone the repository.
2. Run `pnpm install` at the root.
3. Copy `.env.example` to `.env` and fill in your local database credentials.
4. Generate Prisma types: `pnpm db:generate`.
5. Run migrations: `pnpm db:migrate`.
6. (Optional) Seed the database: `pnpm db:seed`.

### Running Locally
Run `pnpm dev` from the root directory. This uses `concurrently` to start:
- Next.js frontend on `http://localhost:3000`
- Express/Socket.IO backend on `http://localhost:4000`

## 2. Coding Standards

- **TypeScript:** Strict mode is enabled. Do not use `any` unless absolutely necessary. Prefer `unknown` or precise generic types.
- **Formatting:** Use Prettier for formatting. Ensure your editor is set to format on save.
- **Linting:** Resolve all ESLint warnings. Do not bypass the linter using `eslint-disable` without leaving a comment explaining *why*.
- **UI Components:** We use Tailwind CSS and Radix UI primitives. Follow the design system outlined in `DESIGN.md`. Do not add custom CSS classes to `globals.css` unless necessary; use Tailwind utility classes.

## 3. Architecture Rules

- **Frontend/Backend Split:** The frontend (`apps/web`) must never directly access the database. All database calls must go through the API (`apps/api`).
- **No PII:** Never add fields to the database that could identify a user (e.g., email, real name) unless strictly isolated from the anonymous persona system.
- **Realtime Sync:** State changes that affect groups should broadcast Socket.IO events to keep clients in sync.

## 4. Branching & Pull Requests

1. Create a feature branch from `main`.
   - Naming convention: `feat/feature-name`, `fix/bug-name`, `chore/task-name`.
2. Commit your changes using Conventional Commits format:
   - `feat: add ephemeral messages`
   - `fix: resolve socket disconnection issue`
   - `docs: update API endpoints`
3. Push to your branch and open a Pull Request against `main`.
4. Ensure the CI checks (TypeScript typecheck, linting) pass.

## 5. Security Vulnerabilities

If you discover a security vulnerability, please do NOT open a public issue. Email the project maintainers directly.
