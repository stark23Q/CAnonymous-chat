# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete initial architecture (Monorepo with Next.js and Express).
- Anonymous persona generation per group.
- Real-time chat via Socket.IO + Redis adapter.
- Advanced chat features: Confessions, Anonymous Polls, Q&A panels.
- JWT-based authentication via HTTP-only cookies.
- Comprehensive UI Design System (Glassmorphism, Neon accents).
- Admin dashboard for group moderation and blind message deletion.
- PWA Support (Manifest, Service Worker, Install Prompts) ready for Play Store Trusted Web Activity (TWA).
- Full technical documentation suite (`ARCHITECTURE.md`, `API.md`, `SECURITY.md`, `DEPLOYMENT.md`).

### Fixed
- Railway production build issues regarding Prisma and TypeScript dependencies.
- Strict TypeScript exactOptionalPropertyTypes compliance for database queries.
